const fs = require('fs');
const path = require('path');
const config = require('../../utilities/config');

function generateInstructionsText() {
    const template = `
Meta App Review Instructions for DMOrbit
======================================

Hello Review Team,

Please follow these steps to verify our usage of the "instagram_manage_messages" and "instagram_manage_comments" permissions.

Test Account Credentials:
- Instagram User: [Insert Test IG Handle]
- Facebook User: [Insert Test FB Email]
- Password: [Insert Password]
- Associated Page ID: ${config.DEFAULT_PAGE_ID}

Step-by-Step Flow:
1. Log into the test Instagram account on a mobile device.
2. Navigate to the DMOrbit test page on Instagram.
3. Send a Direct Message with the keyword "pdf".
4. Observe the automated response arriving instantly with the requested PDF file attached.

This demonstrates our core value proposition: automating Instagram DM delivery for creators.

A video demonstrating the setup process on our Dashboard is attached in this zip file.

Thank you!
`;
    return template;
}

function compilePackage() {
    console.log('\n📦 Compiling App Review Package...');
    
    const outputDir = path.join(__dirname, '../../../operations/evidence/package_output');
    fs.mkdirSync(outputDir, { recursive: true });

    const instructionsPath = path.join(outputDir, 'instructions_for_reviewer.txt');
    fs.writeFileSync(instructionsPath, generateInstructionsText(), 'utf8');

    console.log(`✅ Package compiled successfully at: ${outputDir}`);
    console.log(`📄 Generated instructions text file.`);
    console.log(`(Note: Video zipping logic will be added here once Playwright outputs are finalized).`);
}

module.exports = { compilePackage };

// CLI access
if (require.main === module) {
    compilePackage();
}
