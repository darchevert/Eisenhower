const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FMT_FIX_RUBY = `
  # Fix fmt consteval errors with Xcode 26 clang
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_cfg|
      defs = build_cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || '$(inherited)'
      unless defs.is_a?(Array)
        defs = defs.split(' ')
      end
      unless defs.any? { |d| d.start_with?('FMT_USE_CONSTEVAL') }
        defs.push('FMT_USE_CONSTEVAL=0')
        build_cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
      end
    end
  end
`;

module.exports = function withFmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes('FMT_USE_CONSTEVAL')) return cfg;

      const MARKER = 'post_install do |installer|';
      const lines = contents.split('\n');

      const markerLine = lines.findIndex((l) => l.includes(MARKER));

      if (markerLine === -1) {
        // No post_install block — add one at end of file
        contents += `\npost_install do |installer|\n${FMT_FIX_RUBY}\nend\n`;
        fs.writeFileSync(podfilePath, contents);
        return cfg;
      }

      // Find indent of the `post_install do` line — the matching `end` has the same indent
      const markerIndent = lines[markerLine].match(/^(\s*)/)[1];

      let closingLine = -1;
      for (let i = markerLine + 1; i < lines.length; i++) {
        const trimmed = lines[i].trimEnd();
        const lineIndent = trimmed.match(/^(\s*)/)[1];
        const lineContent = trimmed.trimStart();
        if (lineContent === 'end' && lineIndent === markerIndent) {
          closingLine = i;
          break;
        }
      }

      if (closingLine !== -1) {
        // Insert FMT fix just before the closing `end` of the post_install block
        lines.splice(closingLine, 0, FMT_FIX_RUBY);
        contents = lines.join('\n');
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
