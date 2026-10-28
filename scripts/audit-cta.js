#!/usr/bin/env node
/**
 * CTA audit — proves that every primary button in the app shares ONE container
 * style, and that no screen can override it.
 *
 * Dependency-free (plain Node + fs), so it runs anywhere:
 *
 *   npm run audit:cta
 *
 * Exits with code 1 if any rule is broken.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let failures = 0;
const ok = (msg) => console.log(`  \u2713 ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  \u2717 ${msg}`);
};
const check = (condition, okMsg, failMsg) => {
  if (condition) ok(okMsg);
  else fail(failMsg);
};

// ---------------------------------------------------------------- 1. the box
const cta = read('src/components/ui/ctaStyle.ts');
const button = read('src/components/Button.tsx');
const expectToken = (name, value) =>
  check(
    new RegExp(`export const ${name} = ${value};`).test(cta),
    `${name} = ${value}`,
    `${name} should be ${value}`,
  );

expectToken('CTA_HEIGHT', 56);
expectToken('CTA_RADIUS', 14);
expectToken('CTA_HORIZONTAL_PADDING', 16);
expectToken('CTA_BOTTOM_GAP', 16);

check(
  /width: '100%'/.test(cta),
  "CTA_STYLE width = '100%' of the parent",
  'CTA_STYLE width must be 100%',
);
check(/height: CTA_HEIGHT/.test(cta), 'CTA_STYLE height = CTA_HEIGHT', 'CTA_STYLE height must be CTA_HEIGHT');
check(
  /borderRadius: CTA_RADIUS/.test(cta),
  'CTA_STYLE borderRadius = CTA_RADIUS',
  'CTA_STYLE borderRadius must be CTA_RADIUS',
);
check(/marginHorizontal: 0/.test(cta), 'CTA_STYLE marginHorizontal = 0', 'CTA_STYLE marginHorizontal must be 0');
check(
  /paddingHorizontal: CTA_HORIZONTAL_PADDING/.test(button) && !/paddingHorizontal:/.test(cta),
  'padding lives on the label row, never on the button box',
  'the CTA box must not carry padding (it belongs to the label row)',
);

// ------------------------------------------------- 2. applied last in Button
const styleStart = button.indexOf('style={({ pressed }) => [');
if (styleStart === -1) {
  fail('Button: style array not found');
} else {
  const styleArray = button.slice(styleStart, button.indexOf(']}', styleStart));
  const lastEntry = styleArray.trim().split('\n').pop().trim();
  check(
    lastEntry === 'styles.ctaEnforce,' && /CTA_STYLE,/.test(styleArray),
    'Button: CTA_STYLE applied, then zero-margin guard enforced last',
    `Button: last style entry is "${lastEntry}" — expected the ctaEnforce guard after CTA_STYLE`,
  );
}

// --------------------------------------- 3. one height, no second size scale
check(
  button.includes('const buttonHeight = CTA_HEIGHT;'),
  'Button: height comes from the single CTA_HEIGHT source',
  'Button: height must come from CTA_HEIGHT',
);
check(
  !/BASE_HEIGHTS|size\?: 'sm'/.test(button),
  'Button: no secondary size scale exists',
  'Button: a second size scale is still present (sm/md/lg)',
);
check(
  /CTA_RADIUS/.test(button),
  'Button: gradient fill uses the shared CTA_RADIUS',
  'Button: gradient fill must use CTA_RADIUS',
);

// ------------------------------------------- 4. no screen overrides the box
const FORBIDDEN = [
  'width:',
  'height:',
  'borderRadius:',
  'marginHorizontal:',
  'paddingHorizontal:',
  'alignSelf:',
  'maxWidth:',
  'minWidth:',
];
const screensDir = path.join(ROOT, 'src/screens');
let usages = 0;
for (const file of fs.readdirSync(screensDir).filter((f) => f.endsWith('.tsx'))) {
  const src = fs.readFileSync(path.join(screensDir, file), 'utf8');
  const re = /<CTAButton\b([\s\S]*?)\/>/g;
  let match;
  while ((match = re.exec(src))) {
    usages += 1;
    const block = match[1];
    for (const key of FORBIDDEN) {
      if (block.includes(key)) fail(`${file}: CTAButton overrides "${key}"`);
    }
    const ref = block.match(/style=\{styles\.(\w+)\}/);
    if (ref) {
      const decl = src.match(new RegExp(`\\n\\s*${ref[1]}: \\{([\\s\\S]*?)\\n\\s*\\},`));
      if (!decl) {
        fail(`${file}: style "${ref[1]}" passed to CTAButton is missing`);
      } else {
        for (const key of FORBIDDEN) {
          if (decl[1].includes(key)) fail(`${file}: style "${ref[1]}" sets "${key}" on a CTA`);
        }
      }
    }
  }
}
check(
  usages > 0,
  `${usages} CTAButton usages across screens — none override the shared box`,
  'no CTAButton usages found',
);

// ------------------------------- 5. both Sign In buttons share the component
const signIn = read('src/screens/SignInScreen.tsx');
const signInUsages = (signIn.match(/<CTAButton/g) || []).length;
check(
  signInUsages === 2,
  'SignIn: green "Sign In" and "Continue with Apple" both render through CTAButton',
  `SignIn: expected 2 CTAButton usages, found ${signInUsages}`,
);
check(
  /accessibilityLabel="Sign in"/.test(signIn) && /accessibilityLabel="Continue with Apple"/.test(signIn),
  'SignIn: both labels intact',
  'SignIn: labels changed',
);

// ------------------------------------------------ 6. required CTA coverage
const required = [
  ['OnboardingScreen.tsx', 'Get Started'],
  ['LocationPermissionScreen.tsx', 'Allow Location'],
  ['SignInScreen.tsx', 'Sign In'],
  ['SignInScreen.tsx', 'Continue with Apple'],
  ['SignUpScreen.tsx', 'Sign Up'],
  ['FareEstimateScreen.tsx', 'Confirm Ride'],
  ['DriverAssignedScreen.tsx', 'Driver Arriving'],
  ['TripCompletedScreen.tsx', 'Done'],
  ['src/components/trip/DriverRatingSheet.tsx', 'Submit Rating'],
];
for (const [file, title] of required) {
  const rel = file.includes('/') ? file : `src/screens/${file}`;
  check(
    read(rel).includes(`title="${title}"`),
    `${file}: "${title}" present`,
    `${file}: "${title}" is missing`,
  );
}

console.log(
  failures === 0
    ? '\nCTA_AUDIT_PASS — every primary button shares one container style.'
    : `\nCTA_AUDIT_FAIL — ${failures} problem(s) above.`,
);
process.exit(failures === 0 ? 0 : 1);
