const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// This Ruby snippet is injected just before the closing `end` of the existing
// post_install block. It sets FMT_USE_CONSTEVAL=0 via OTHER_CPLUSPLUSFLAGS
// (passed directly to clang) so Xcode 26's stricter consteval mode is disabled
// for all pod targets.
const FMT_FIX_RUBY = `
  # withFmtFix: disable consteval for fmt library (Xcode 26 compatibility)
  puts "withFmtFix: patching #{installer.pods_project.targets.length} targets"
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      existing = (config.build_settings['OTHER_CPLUSPLUSFLAGS'] || '$(inherited)').to_s
      unless existing.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = existing + ' -DFMT_USE_CONSTEVAL=0'
      end
      existing2 = (config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || '$(inherited)').to_s
      unless existing2.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = existing2 + ' FMT_USE_CONSTEVAL=0'
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

      if (contents.includes('FMT_USE_CONSTEVAL')) {
        process.stderr.write('withFmtFix: already patched, skipping\n');
        return cfg;
      }

      const MARKER = 'post_install do |installer|';
      const lines = contents.split('\n');
      const markerLine = lines.findIndex((l) => l.includes(MARKER));

      if (markerLine === -1) {
        process.stderr.write('withFmtFix: no post_install found, appending new block\n');
        contents += `\npost_install do |installer|\n${FMT_FIX_RUBY}\nend\n`;
        fs.writeFileSync(podfilePath, contents);
        return cfg;
      }

      const markerIndent = lines[markerLine].match(/^(\s*)/)[1];
      process.stderr.write(`withFmtFix: found post_install at line ${markerLine + 1}, indent="${markerIndent}"\n`);

      let closingLine = -1;
      for (let i = markerLine + 1; i < lines.length; i++) {
        const raw = lines[i];
        const lineIndent = raw.match(/^(\s*)/)[1];
        const lineContent = raw.trim();
        if (lineContent === 'end' && lineIndent === markerIndent) {
          closingLine = i;
          break;
        }
      }

      process.stderr.write(`withFmtFix: closingLine=${closingLine}\n`);

      if (closingLine !== -1) {
        lines.splice(closingLine, 0, FMT_FIX_RUBY);
        contents = lines.join('\n');
        process.stderr.write('withFmtFix: injection successful\n');
      } else {
        process.stderr.write('withFmtFix: WARNING — closingLine not found, Podfile unchanged\n');
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
