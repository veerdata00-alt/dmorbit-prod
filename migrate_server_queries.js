const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// 1. Schema update
code = code.replace(
    /status: \{ type: String, enum: \['draft', 'active', 'paused', 'archived'\], default: 'active' \},/,
    `status: { type: String, enum: ['draft', 'active', 'paused', 'deleted'], default: 'active' },\n    deletedAt: { type: Date, default: null },`
);

// 2. Count limits & queries
code = code.replace(/Automation\.countDocuments\(\)/g, "Automation.countDocuments({ status: { $ne: 'deleted' } })");
code = code.replace(/Automation\.countDocuments\(\{ userId: user\._id\.toString\(\) \}\)/g, "Automation.countDocuments({ userId: user._id.toString(), status: { $ne: 'deleted' } })");
code = code.replace(/Automation\.countDocuments\(\{ userId: id \}\)/g, "Automation.countDocuments({ userId: id, status: { $ne: 'deleted' } })");
code = code.replace(/Automation\.countDocuments\(\{ userId: req\.user\.userId \}\)/g, "Automation.countDocuments({ userId: req.user.userId, status: { $ne: 'deleted' } })");
code = code.replace(/Automation\.countDocuments\(\{ userId \}\)/g, "Automation.countDocuments({ userId, status: { $ne: 'deleted' } })");

// 3. Find queries
code = code.replace(/Automation\.find\(\{ userId: req\.user\.userId \}\)/g, "Automation.find({ userId: req.user.userId, status: { $ne: 'deleted' } })");
code = code.replace(/Automation\.findOne\(\{ _id: id, userId: req\.user\.userId \}\)/g, "Automation.findOne({ _id: id, userId: req.user.userId, status: { $ne: 'deleted' } })");
code = code.replace(/Automation\.findOne\(\{ _id: req\.params\.id, userId: req\.user\.userId \}\)/g, "Automation.findOne({ _id: req.params.id, userId: req.user.userId, status: { $ne: 'deleted' } })");

// 4. Archive API Endpoint -> Soft Delete Endpoint
const oldEndpointRegex = /\/\/ Archive Automation\napp\.delete\('\/api\/automations\/:id', authenticateToken, async \(req, res\) => \{\n    const \{ id \} = req\.params;\n    try \{\n        const result = await Automation\.updateOne\(\{ _id: id, userId: String\(req\.user\.userId\) \}, \{ \$set: \{ status: 'archived', isActive: false \} \}\);\n        if \(result\.matchedCount === 0\) \{\n            const result2 = await Automation\.updateOne\(\{ _id: id \}, \{ \$set: \{ status: 'archived', isActive: false \} \}\);\n            if \(result2\.matchedCount === 0\) \{\n                return res\.status\(404\)\.json\(\{ error: 'Automation not found or unauthorized' \}\);\n            \}\n        \}\n        res\.status\(200\)\.json\(\{ success: true, message: 'Automation archived' \}\);/g;

const newEndpoint = `// Delete Automation (Soft Delete)\napp.delete('/api/automations/:id', authenticateToken, async (req, res) => {\n    const { id } = req.params;\n    try {\n        const result = await Automation.updateOne({ _id: id, userId: String(req.user.userId) }, { $set: { status: 'deleted', isActive: false, deletedAt: new Date() } });\n        if (result.matchedCount === 0) {\n            const result2 = await Automation.updateOne({ _id: id }, { $set: { status: 'deleted', isActive: false, deletedAt: new Date() } });\n            if (result2.matchedCount === 0) {\n                return res.status(404).json({ error: 'Automation not found or unauthorized' });\n            }\n        }\n        res.status(200).json({ success: true, message: 'Automation deleted' });`;

code = code.replace(oldEndpointRegex, newEndpoint);

fs.writeFileSync('server.js', code);
console.log('Migration script applied successfully!');
