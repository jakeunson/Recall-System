const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = 'C:\\Users\\silen\\.gemini\\antigravity\\brain\\4bd01827-72dc-47b8-8174-05045186e9dd\\.system_generated\\logs\\transcript_full.jsonl';
const fileStates = {};
const calls = [];

async function processTranscript() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  // collect calls
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      if (step.tool_calls) {
        for (const call of step.tool_calls) {
          const fnName = call.name;
          const args = call.args;
          if (!fnName || !args) continue;
          if (fnName.includes('write_to_file') || fnName.includes('replace_file_content')) {
            if (args.TargetFile && args.TargetFile.toLowerCase().includes('src')) {
              calls.push(call);
              const fPath = args.TargetFile.replace(/\\\\/g, '/');
              if (!fileStates[fPath]) {
                if (fs.existsSync(fPath)) {
                  fileStates[fPath] = fs.readFileSync(fPath, 'utf8');
                } else {
                  fileStates[fPath] = '';
                }
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  // apply calls
  for (const call of calls) {
    const fnName = call.name;
    const args = call.args;
    const fPath = args.TargetFile.replace(/\\\\/g, '/');
    if (fnName.includes('write_to_file')) {
      fileStates[fPath] = args.CodeContent;
    } else if (fnName.includes('replace_file_content') && !fnName.includes('multi')) {
      const before = fileStates[fPath];
      const tContent = args.TargetContent;
      const rContent = args.ReplacementContent;
      if (before && before.includes(tContent)) {
        fileStates[fPath] = before.replace(tContent, rContent);
      }
    } else if (fnName.includes('multi_replace_file_content')) {
      let before = fileStates[fPath];
      for (const chunk of args.ReplacementChunks || []) {
        if (before && before.includes(chunk.TargetContent)) {
          before = before.replace(chunk.TargetContent, chunk.ReplacementContent);
        }
      }
      fileStates[fPath] = before;
    }
  }

  // write back
  let recoveredCount = 0;
  for (const fPath of Object.keys(fileStates)) {
    if (!fPath.toLowerCase().includes('.json')) {
      if (fileStates[fPath].trim() !== '') {
        fs.mkdirSync(path.dirname(fPath), {recursive: true});
        fs.writeFileSync(fPath, fileStates[fPath], 'utf8');
        recoveredCount++;
      }
    }
  }
  console.log(`Fully recovered ${recoveredCount} files.`);
}

processTranscript();
