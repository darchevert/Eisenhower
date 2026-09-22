const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FMT_FIX_LINES = [
  '  # Fix fmt consteval errors with Xcode 26 clang',
  '  installer.pods_project.targets.each do |target|',
  '    target.build_configurations.each do |build_cfg|',
  "      defs = build_cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']",
  '      defs = [defs] unless defs.is_a?(Array)',
  "      defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')",
  "      build_cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs",
  '    end',
  '  end',
];

module.exports = function withFmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes('FMT_USE_CONSTEVAL')) return cfg;

      const MARKER = 'post_install do |installer|';
      const markerIdx = contents.indexOf(MARKER);

      if (markerIdx === -1) {
        contents += `\npost_install do |installer|\n${FMT_FIX_LINES.join('\n')}\nend\n`;
        fs.writeFileSync(podfilePath, contents);
        return cfg;
      }

      // Find which line the marker is on
      const lines = contents.split('\n');
      let markerLine = -1;
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1 for \n
        if (charCount > markerIdx && markerLine === -1) {
          markerLine = i;
        }
      }

      // Scan lines after marker, track block depth to find the matching `end`
      let depth = 1;
      let closingLine = -1;
      for (let i = markerLine + 1; i < lines.length && depth > 0; i++) {
        const t = lines[i].trim();
        // Block openers
        if (/\bdo(\s*\|[^|]*\|)?\s*(#.*)?$/.test(t)) depth++;
        if (/^(if|unless|while|until|for|begin|class|module|def)\b/.test(t) && !/\bend\b/.test(t)) depth++;
        // Block closer
        if (/^end(\b|$)/.test(t)) {
          depth--;
          if (depth === 0) closingLine = i;
        }
      }

      if (closingLine !== -1) {
        lines.splice(closingLine, 0, ...FMT_FIX_LINES);
        contents = lines.join('\n');
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
