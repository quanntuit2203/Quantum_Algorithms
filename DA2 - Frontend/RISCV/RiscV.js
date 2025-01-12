document.addEventListener('DOMContentLoaded', (event) => {
    const codeInput = document.getElementById('code-input');
    const resetButton = document.getElementById('reset-btn');
    const runButton = document.getElementById('run-btn');
    const stepButton = document.getElementById('sbs-btn');
    const outputDisplay = document.getElementById('output-display');
    const downloadButton = document.getElementById('download-btn');
    const fileInput = document.getElementById('fileInput');
    const modeButton = document.getElementById('mode-btn');

    const editor = CodeMirror.fromTextArea(codeInput, {
        lineNumbers: true,
        mode: "javascript"
    });
    stepButton.disabled = true;
    let currentIndex = 0;
    let totalLines = 0;
    let currentLine = 0;
    let commands = [];
    let previousHighlightedLine = null;
    let stepCount = parseInt(localStorage.getItem('stepCount')) || 0;
    const registersPerStep = 32;
    
    if (localStorage.getItem('savedCodeR')) {
        editor.setValue(localStorage.getItem('savedCodeR'));
    }
    if (localStorage.getItem('savedRegisterOutput')) {
        outputDisplay.textContent = localStorage.getItem('savedRegisterOutput');
    }
    if (localStorage.getItem('savedMemoryOutput')) {
        outputDisplay.textContent = localStorage.getItem('savedMemoryOutput');
    }
    if (localStorage.getItem('stepCount')) {
        outputDisplay.textContent = localStorage.getItem('stepCount');
    }
    
    editor.on('change', function () {
        highlightKeywords(editor);
        localStorage.setItem('savedCodeR', editor.getValue());
    });

    function highlightKeywords(editor) {
        const inst      = ["srl", "sra", "slt", "sll", "sltu", "xor", "add", "sub", "or", "and", "addi", 
                           "slti", "sltiu", "xori", "ori", "andi", "slli" , "srli", "srai", "auipc"    , 
                           "lui", "lb", "lh", "lw", "lbu", "lhu", "sb", "sh", "sw", "beq", "bne"       , 
                           "blt", "bge", "bltu", "bgeu"  , "jalr", "jal"];
        const register  = ["x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "x10", "x11"    , 
                           "x12", "x13", "x14" ,"x15", "x16", "x17", "x18", "x19", "x20", "x21", "x22" , 
                           "x23", "x24", "x25", "x26", "x27", "x28", "x29", "x30", "x31"];

        const regex_inst = new RegExp(`\\b(${inst.join('|')})\\b`, 'g');
        const regex_reg = new RegExp(`\\b(${register.join('|')})\\b`, 'g');

        editor.eachLine((line) => {
            const lineNumber = editor.getLineNumber(line);
            const lineText = line.text;
            const matches_inst = [...lineText.matchAll(regex_inst)];
            const matches_reg  = [...lineText.matchAll(regex_reg)];

            let currentIndex = 0;

            matches_inst.forEach((match_inst) => {
                editor.markText(
                    { line: lineNumber, ch: match_inst.index },
                    { line: lineNumber, ch: match_inst.index + match_inst[0].length },
                    { className: 'highlighted_inst' }
                );
                currentIndex = Math.max(currentIndex, match_inst.index + match_inst[0].length);
            });
            matches_reg.forEach((match_reg) => {
                editor.markText(
                    { line: lineNumber, ch: match_reg.index },
                    { line: lineNumber, ch: match_reg.index + match_reg[0].length },
                    { className: 'highlighted_reg' }
                );
                currentIndex = Math.max(currentIndex, match_reg.index + match_reg[0].length);
            });
            // Highlight other text
            let remainingTextStart = 0;
            [...matches_inst, ...matches_reg].sort((a, b) => a.index - b.index).forEach((match) => {
                if (remainingTextStart < match.index) {
                    // Highlight remaining text before the match
                    const segment = lineText.substring(remainingTextStart, match.index);
                    const nonDigitMatches = [...segment.matchAll(/[^0-9\s]+/g)];

                    nonDigitMatches.forEach((nonDigitMatch) => {
                        editor.markText(
                            { line: lineNumber, ch: remainingTextStart + nonDigitMatch.index },
                            { line: lineNumber, ch: remainingTextStart + nonDigitMatch.index + nonDigitMatch[0].length },
                            { className: 'highlighted_other' }
                        );
                    });
                }
                remainingTextStart = match.index + match[0].length;
            });

            if (remainingTextStart < lineText.length) {
                const segment = lineText.substring(remainingTextStart);
                const nonDigitMatches = [...segment.matchAll(/[^0-9\s]+/g)];

                nonDigitMatches.forEach((nonDigitMatch) => {
                    editor.markText(
                        { line: lineNumber, ch: remainingTextStart + nonDigitMatch.index },
                        { line: lineNumber, ch: remainingTextStart + nonDigitMatch.index + nonDigitMatch[0].length },
                        { className: 'highlighted_other' }
                    );
                });
            }
        });
    }

    resetButton.addEventListener('click', async function () {
        localStorage.removeItem('savedCodeR');
        localStorage.removeItem('savedMemoryOutput');
        localStorage.removeItem('savedRegisterOutput');
        localStorage.removeItem('stepCount');
        outputDisplay.textContent = '';
        stepCount = 0;
        currentIndex = 0;
        commands = [];
        removehighlightLineNumber();
        stepButton.disabled = false;
        
    });
    
    let currentMode = 'RISC-V';

    // Gán sự kiện click cho nút chuyển đổi chế độ
    modeButton.addEventListener('click', () => {
        if (currentMode === 'RISC-V') {
            // Lưu dữ liệu RISC-V trước khi chuyển sang Quantum
            const currentCode = editor.getValue();
            const currentOutput = outputDisplay.textContent;
            localStorage.setItem('savedCodeR', currentCode);
            localStorage.setItem('savedOutputR', currentOutput);
        }
        
        modeButton.textContent = currentMode;
    });

   
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0]; // Lấy tệp đầu tiên
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result; // Lấy nội dung file
                editor.setValue(content); // Đưa nội dung vào CodeMirror
            };
            reader.readAsText(file); // Đọc tệp dưới dạng văn bản
        }
    });

    downloadButton.addEventListener('click', function() {
        const outputContent = outputDisplay.textContent;  // Lấy nội dung từ outputDisplay
        downloadFile('output_result.txt', outputContent);  // Gọi hàm để tải file xuống
    });

    // Hàm tạo file TXT từ nội dung và tải xuống
    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    function highlightLineNumber(lineNumber) {
        
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');

        lineNumbers.forEach((line) => {
            line.classList.remove('highlighted-line-number');
        });

        if (lineNumber < lineNumbers.length) {
            lineNumbers[lineNumber].classList.add('highlighted-line-number');
        }
    }

    function removehighlightLineNumber() {
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
        lineNumbers.forEach((line) => {
        line.classList.remove('highlighted-line-number');
    });

    currentLine = 0;
    previousHighlightedLine = null;
    }
    runButton.addEventListener('click', async () => {
        const code = editor.getValue();
        if (!code.trim()) { 
            outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
            return; 
        }
        try {
            await fetch('http://127.0.0.1:5000/process_assembly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code }),
            });
            const issResponse = await fetch('http://127.0.0.1:5000/process_iss', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})  
            });
            
            if (!issResponse.ok) throw new Error('Không thể lấy dữ liệu từ process_iss');
            const issResult = await issResponse.json();
    
            const regOutput = issResult.registers;
            const memOutput = issResult.memory;
    
            localStorage.setItem('savedRegisterOutput', regOutput);
            localStorage.setItem('savedMemoryOutput', memOutput);
           
        } catch (error) {
            outputDisplay.textContent = `Lỗi: ${error.message}`;
        }
});
    let previousStep = 0;
    let usePreviousStep = false;

    stepButton.addEventListener('click', async () => {
        const code = editor.getValue();
        totalLines = editor.lineCount();
        
        if (!code.trim()) { 
            outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
            return; // Dừng thực thi nếu không có code
        }
        
        try {
          
            const issResponse = await fetch('http://127.0.0.1:5000/step_iss', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})  // Truyền mode dưới dạng JSON
            });
    
            if (!issResponse.ok) {
                throw new Error('Lỗi: Không thể thực thi ISS.');
            }
            const issResult = await issResponse.json();
            const storeLog = issResult.store;
            const lineContent = editor.getLine(currentLine).trim();
            let lockEx = false;
            stepCount++;
            
            highlightLineNumber(currentLine);
            if (lineContent.startsWith('bge')) {
                const parts = lineContent.split(',');
                const targetLabel = parts[2].trim();  // Lấy nhãn 'loop'
                lockEx = true;
                for (let i = currentLine - 1; i >= 0; i--) {
                    const prevLine = editor.getLine(i).trim();
                    if (prevLine.startsWith(targetLabel) && prevLine.endsWith(':')) {
                        currentLine = i; 
                        
                        break;
                    }
                }
            }
            
            const logLines = storeLog.split('\n');
            let filteredLog = [];
            let capture = false;
            if(!lockEx) {
                for (let i = logLines.length - 1; i >= 0; i--) {
                    if (logLines[i].startsWith('done 31 -')) {
                        const match = logLines[i].match(/done 31 - (\d+)/);
                        if (match) {
                            let logStep = parseInt(match[1], 10);
                            if (lineContent.endsWith(':')) {
                                usePreviousStep = true;  
                                previousStep = stepCount - 1;
                                if (logStep === previousStep) {
                                    capture = true; 
                                }  
                                
                                if (logStep === previousStep - 1) {
                                    capture = false;
                                }
                            }   else {
                                
                                if (usePreviousStep) {
                                    if (logStep === previousStep+1) {
                                        capture = true;
                                        previousStep++; 
                                    }
                                    if (logStep === previousStep-1) {
                                        capture = false;
                                    }
                                } else {
                                    
                                    if (logStep === stepCount) {
                                        capture = true;
                                       
                                    }
                                    if (logStep === stepCount - 1) {
                                        capture = false;
                                    }
                                }
                            }
                        }
                    }
                    if (capture) {  
                        filteredLog.unshift(logLines[i]);
                    }
                }
                outputDisplay.textContent = '';
               
                if (filteredLog.length === 0) {
                    outputDisplay.textContent = "Kết thúc. Không có dữ liệu phù hợp.";
                    stepButton.disabled = true;
                } else {
                    outputDisplay.textContent = `Step Count: ${stepCount}\n` +filteredLog.join('\n'); //`Step Count: ${stepCount}\n` + 
                }
            }
            if (currentLine >= totalLines - 1) {
                stepButton.disabled = true;
                currentLine = 0;  
            } else {  
                currentLine++;
            }
           
            localStorage.setItem('savedRegisterOutput', filteredLog.join('\n'));
            localStorage.setItem('stepCount', stepCount);

        } catch (error) {
            outputDisplay.textContent = `Lỗi Assembly/RISC-V: ${error.message}`;
        }
    });
    
    function parseCommands(code) {
        commands = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
});
document.addEventListener('DOMContentLoaded', () => {
        const tabs = document.querySelectorAll('.tab-link');
        const outputDisplay = document.getElementById('output-display');
    
        const showContentFromStorage = (apiEndpoint) => {
            if (apiEndpoint === '/get_reg_output') {
                const regOutput = localStorage.getItem('savedRegisterOutput');
                outputDisplay.textContent = regOutput || "Chưa có dữ liệu. Hãy nhấn Run.";
            } else if (apiEndpoint === '/get_mem_output') {
                const memOutput = localStorage.getItem('savedMemoryOutput');
                outputDisplay.textContent = memOutput || "Chưa có dữ liệu. Hãy nhấn Run.";
            }
        };
        tabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                tabs.forEach(t => t.classList.remove('active'));
                event.currentTarget.classList.add('active');
                const apiEndpoint = event.currentTarget.getAttribute('data-endpoint');
                showContentFromStorage(apiEndpoint);
            });
        });
        const defaultTab = document.querySelector('.tab-link.active');
        if (defaultTab) {
            const defaultEndpoint = defaultTab.getAttribute('data-endpoint');
            showContentFromStorage(defaultEndpoint);
        }
    });
