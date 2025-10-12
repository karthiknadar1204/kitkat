# Publishing Guide for Kyra Observability SDK

## Pre-Publishing Checklist

- [x] Package.json configured correctly
- [x] README.md created
- [x] LICENSE file added
- [x] .npmignore configured
- [x] Local testing complete
- [x] Version number set (0.1.0)

## Testing Locally (Completed)

```bash
# In SDK directory
npm pack
# Creates kyra-observability-sdk-0.1.1.tgz

# In test directory
npm install ../langsmith-sdk/kyra-observability-sdk-0.1.1.tgz
node test.js
```

✅ **Test Results:**
- Package installs successfully
- OpenAI integration works
- Chain execution works
- Graceful error handling confirmed

## Publishing to NPM

### Step 1: Create NPM Account
```bash
npm login
# Follow prompts to login or create account
```

### Step 2: Verify Package
```bash
cd langsmith-sdk
npm pack --dry-run
# Review what will be published
```

### Step 3: Publish

**Public Package (Recommended for OSS):**
```bash
npm publish --access public
```

**Private Package (Requires Paid NPM Account):**
```bash
npm publish
```

### Step 4: Verify Publication
```bash
npm view kyra-observability-sdk
```

## Using Published Package

### Installation
```bash
npm install kyra-observability-sdk
```

### Usage
```javascript
require('dotenv').config();
const Kyra = require('kyra-observability-sdk');

const sdk = new Kyra();

async function main() {
  const response = await sdk.chatCompletions({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
  console.log(response.choices[0].message.content);
}

main();
```

## Version Management

### Semantic Versioning
- **0.1.0** - Initial release
- **0.1.1** - Current version (bug fixes)
- **0.1.x** - Bug fixes
- **0.x.0** - New features (backwards compatible)
- **x.0.0** - Breaking changes

### Updating Version
```bash
# Patch (0.1.1 -> 0.1.2)
npm version patch

# Minor (0.1.1 -> 0.2.0)
npm version minor

# Major (0.1.1 -> 1.0.0)
npm version major
```

## Alternative: Private Registry

### Using Verdaccio (Self-hosted)
```bash
# Install Verdaccio
npm install -g verdaccio

# Run
verdaccio

# Configure
npm set registry http://localhost:4873/

# Publish
npm publish
```

### Using GitHub Packages
1. Create `.npmrc` in SDK root:
```
registry=https://npm.pkg.github.com/karthiknadar1204
```

2. Authenticate:
```bash
npm login --registry=https://npm.pkg.github.com
```

3. Update `package.json`:
```json
{
  "name": "@karthiknadar1204/kyra-observability-sdk",
  "repository": "git://github.com/karthiknadar1204/kyra.git"
}
```

4. Publish:
```bash
npm publish
```

## Post-Publishing

### Update Documentation
- Add npm badge to README
- Create changelog entry
- Tag release in Git:
```bash
git tag v0.1.1
git push origin v0.1.1
```

### Monitor
- Check npm download stats
- Monitor issue reports
- Update as needed

## Troubleshooting

### "Package already exists"
- Package name is taken
- Change name in `package.json` to something unique like `@karthiknadar1204/kyra-observability-sdk`

### "Authentication failed"
```bash
npm logout
npm login
```

### "403 Forbidden"
- Need `--access public` for scoped packages
- Or need paid account for private packages

## Support

For publishing issues:
- NPM Support: https://npmjs.com/support
- NPM Documentation: https://docs.npmjs.com/

## Next Steps

1. **Publish to NPM** (when ready)
2. **Create GitHub Repository**
3. **Add CI/CD** (GitHub Actions for automated testing)
4. **Add More Features:**
   - Streaming support
   - Feedback API
   - Python SDK
   - Additional LLM providers

## Current Status

✅ **Package is ready for publishing!**

The package has been:
- Successfully built
- Tested locally
- Documented
- Versioned

**To publish:** Run `npm publish --access public` in the `langsmith-sdk` directory.

---

## Published Package Info

**Package Name:** `kyra-observability-sdk`  
**Current Version:** `0.1.1`  
**NPM URL:** https://www.npmjs.com/package/kyra-observability-sdk  
**GitHub:** https://github.com/karthiknadar1204/kyra

