document.addEventListener('DOMContentLoaded', (event) => {
    const codeInput = document.getElementById('code-input');
    const resetButton = document.getElementById('reset-btn');
    const runButton = document.getElementById('run-btn');
    const stepButton = document.getElementById('sbs-btn');
    const outputDisplay = document.getElementById('output-display');
    const downloadButton = document.getElementById('download-btn');
    const fileInput = document.getElementById('fileInput');
    const modeButton = document.getElementById('mode-btn');
    const tabs = document.querySelectorAll('.tab-link');
    // Khởi tạo CodeMirror
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

    // Kiểm tra và tải dữ liệu từ localStorage cho RISC-V
    if (localStorage.getItem('savedCodeMixed')) {
        editor.setValue(localStorage.getItem('savedCodeMixed'));
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
    // Sự kiện khi có thay đổi trong CodeMirror
    editor.on('change', function () {
        highlightKeywords(editor);
        localStorage.setItem('savedCodeMixed', editor.getValue());
    });
// Hàm để tô màu cú pháp cho các từ khóa
function highlightKeywords(editor) {
    const keywords = ['reset', 'write', 'not', 'cnot', 'hadamard', 'chadamard', 'swap', 'phase', 'rotatex', 'rotatey'];
    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

    editor.eachLine((line) => {
        const lineNumber = editor.getLineNumber(line);
        const lineText = line.text;
        const matches = [...lineText.matchAll(regex)];

        matches.forEach((match) => {
            editor.markText(
                { line: lineNumber, ch: match.index },
                { line: lineNumber, ch: match.index + match[0].length },
                { className: 'highlighted' }
            );
        });
    });
}
    // Hàm để tô màu cú pháp cho các từ khóa
    function highlightKeywords(editor) {
        const inst      = ["srl", "sra", "slt", "sll", "sltu", "xor", "add", "sub", "or", "and", "addi", 
                           "slti", "sltiu", "xori", "ori", "andi", "slli" , "srli", "srai", "auipc"    , 
                           "lui", "lb", "lh", "lw", "lbu", "lhu", "sb", "sh", "sw", "beq", "bne"       , 
                           "blt", "bge", "bltu", "bgeu"  , "jalr", "jal"];
        const register  = ["x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "x10", "x11"    , 
                           "x12", "x13", "x14" ,"x15", "x16", "x17", "x18", "x19", "x20", "x21", "x22" , 
                           "x23", "x24", "x25", "x26", "x27", "x28", "x29", "x30", "x31"];
        const q_word    = ['reset', 'write', 'not', 'cnot', 'hadamard', 'chadamard', 'swap', 'phase', 
                          'rotatex', 'rotatey'];
        
        const regex_q    = new RegExp(`\\b(${q_word.join('|')})\\b`, 'g');
        const regex_inst = new RegExp(`\\b(${inst.join('|')})\\b`, 'g');
        const regex_reg  = new RegExp(`\\b(${register.join('|')})\\b`, 'g');

        editor.eachLine((line) => {
            const lineNumber = editor.getLineNumber(line);
            const lineText = line.text;
            const matches_inst = [...lineText.matchAll(regex_inst)];
            const matches_reg  = [...lineText.matchAll(regex_reg)];
            const matches_q    = [...lineText.matchAll(regex_q)];

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
            matches_q.forEach((match_q) => {
                editor.markText(
                    { line: lineNumber, ch: match_q.index },
                    { line: lineNumber, ch: match_q.index + match_q[0].length },
                    { className: 'highlighted_q' }
                );
                currentIndex = Math.max(currentIndex, match_q.index + match_q[0].length);
            });

            // Highlight other text
            let remainingTextStart = 0;
            [...matches_inst, ...matches_reg, ...matches_q].sort((a, b) => a.index - b.index).forEach((match) => {
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

            // Highlight any remaining text after the last match
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
        localStorage.removeItem('savedQuantumOutput');
        localStorage.removeItem('stepCount');
        outputDisplay.textContent = '';
        stepCount = 0;
        currentIndex = 0;
        commands = [];
        removehighlightLineNumber();
        // Kích hoạt lại nút Step
        stepButton.disabled = false;
    });
    

    let currentMode = 'Mixed (Quantum & RISC-V)';

    // Gán sự kiện click cho nút chuyển đổi chế độ
    modeButton.addEventListener('click', () => {
        if (currentMode === 'Mixed (Quantum & RISC-V)') {
            // Lưu dữ liệu RISC-V trước khi chuyển sang Quantum
            const currentCode = editor.getValue();
            const currentOutput = outputDisplay.textContent;
            localStorage.setItem('savedCodeMixed', currentCode);
            localStorage.setItem('savedOutputR', currentOutput);
        }
        modeButton.textContent = currentMode;
    });

    
    
    // Gán sự kiện tải file và hiển thị nội dung trong CodeMirror
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

    // Sự kiện khi người dùng nhấn nút Download
    downloadButton.addEventListener('click', function() {
        const outputContent = outputDisplay.textContent;  // Lấy nội dung từ outputDisplay
        downloadFile('output_result.txt', outputContent);  // Gọi hàm để tải file xuống
    });

    // Hàm kiểm tra loại code trong input
    function determineHighlightMode(code) {
        const quantumKeywords = ['reset', 'write', 'not', 'cnot', 'hadamard', 'chadamard', 'swap', 'phase', 'rotatex', 'rotatey', 'measure'];
        const riscvKeywords = ["srl", "sra", "slt", "sll", "sltu", "xor", "add", "sub", "or", "and", "addi", 
                                "slti", "sltiu", "xori", "ori", "andi", "slli" , "srli", "srai", "auipc"    , 
                                "lui", "lb", "lh", "lw", "lbu", "lhu", "sb", "sh", "sw", "beq", "bne"       , 
                                "blt", "bge", "bltu", "bgeu"  , "jalr", "jal"];

        const lines = code.split('\n').map(line => line.trim());
        let containsQuantum = false;
        let containsRiscV = false;

        // Kiểm tra từng dòng để xác định loại từ khóa
        for (const line of lines) {
            if (quantumKeywords.some(keyword => line.startsWith(keyword))) {
                containsQuantum = true;
            }
            if (riscvKeywords.some(keyword => line.startsWith(keyword))) {
                containsRiscV = true;
            }
            // Nếu cả hai loại từ khóa được tìm thấy, dừng kiểm tra sớm
            if (containsQuantum && containsRiscV) {
                return 'mixed';
            }
        }
        if (containsQuantum) return 'quantum';
        if (containsRiscV) return 'riscv';
        return 'none';
    }
    // Hàm tạo file TXT từ nội dung và tải xuống
    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    function highlightLineNumber(lineNumber, mode) {
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
    
        // Loại bỏ tất cả highlight hiện tại
        lineNumbers.forEach((line) => {
            line.classList.remove('highlighted-line-number');
        });
    
        let adjustedLineNumber = lineNumber;
    
        // Nếu chế độ là 'mixed', điều chỉnh lineNumber
        if (mode === 'mixed') {
            adjustedLineNumber = lineNumber + 1;
        }
    
        // Thêm highlight vào dòng chỉ định
        if (adjustedLineNumber >= 0 && adjustedLineNumber < lineNumbers.length) {
            lineNumbers[adjustedLineNumber].classList.add('highlighted-line-number');
        }
    }
    function removehighlightLineNumber() {
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
        lineNumbers.forEach((line) => {
        line.classList.remove('highlighted-line-number');
    });

    // Reset lại trạng thái của dòng hiện tại
    currentLine = 0;
    previousHighlightedLine = null;
    }
    runButton.addEventListener('click', async () => {
            const code = editor.getValue();
            localStorage.removeItem('savedQuantumOutput');
            if (!code.trim()) {
                const errorMessage = "Chưa có input nên không thể chạy chương trình";
                outputDisplay.textContent = errorMessage;
                // localStorage.setItem('savedQuantumOutput', errorMessage);
                // localStorage.setItem('savedRegisterOutput', errorMessage);
                // localStorage.setItem('savedMemoryOutput', errorMessage);
                return;
            }
            try {
                const Qresponse = await fetch('http://127.0.0.1:5000/run_code_quantum', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: code, mode: 1 }),
                });
        
                if (!Qresponse.ok) {
                    throw new Error('Network response was not ok');
                }
        
                const Qresult = await Qresponse.json();
                outputDisplay.textContent = Qresult.output;
        
                localStorage.setItem('savedQuantumOutput', Qresult.output);
                const quantumTab = document.querySelector('.tab-link[data-endpoint="/run_code_quantum"]');
                if (quantumTab.classList.contains('active')) {
                    outputDisplay.textContent = Qresult.output;
                }
            } catch (error) {
                outputDisplay.textContent = `Error: ${error.message}`;
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
                    body: JSON.stringify({ mode: true })  // Truyền mode dưới dạng JSON
                });  // Chế độ Run
                const issResult = await issResponse.json();
                const regOutput = issResult.registers;
                const memOutput = issResult.memory;
                
                localStorage.setItem('savedRegisterOutput', regOutput);
                localStorage.setItem('savedMemoryOutput', memOutput);
        
                const activeTab = document.querySelector('.tab-link.active');
                const activeEndpoint = activeTab.getAttribute('data-endpoint');

                if (activeEndpoint === '/get_reg_output') {
                    outputDisplay.textContent = regOutput;
                } else if (activeEndpoint === '/get_mem_output') {
                    outputDisplay.textContent = memOutput;
                }
            } catch (error) {
                outputDisplay.textContent = `Lỗi: ${error.message}`;
            }
    });
    let previousStep = 0;
    let usePreviousStep = false;
    // Gán sự kiện click cho nút step
    stepButton.addEventListener('click', async () => {
        const code = editor.getValue();
        totalLines = editor.lineCount();
        
        if (!code.trim()) { 
            outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
            return; // Dừng thực thi nếu không có code
        }
        
        try {
            const mode = determineHighlightMode(code);
            const lineContent = editor.getLine(currentLine).trim();
            highlightLineNumber(currentLine, mode);
            stepCount++;

            let filteredLog = [];
            const quantumKeywords = ['reset', 'write', 'not', 'cnot', 'hadamard', 'chadamard', 'swap', 'phase', 'rotatex', 'rotatey'];
            if (quantumKeywords.some(keyword => lineContent.startsWith(keyword))) {
                // Gọi API quantum với dòng hiện tại
                try {
                    const quantumResponse = await fetch('http://127.0.0.1:5000/run_code_quantum', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code: lineContent, mode: 2 }), // Truyền dòng hiện tại vào API
                    });

                    if (!quantumResponse.ok) {
                        throw new Error('Lỗi: Không thể thực thi Quantum API.');
                    }

                    const quantumResult = await quantumResponse.json();
                    localStorage.setItem('savedQuantumOutput', quantumResult.output);
                    //updateTabContent('/run_code_quantum', quantumResult.output);
                    const quantumTab = document.querySelector('.tab-link[data-endpoint="/run_code_quantum"]');
                    if (quantumTab.classList.contains('active')) {
                        outputDisplay.textContent = quantumResult.output;
                    }
                } catch (quantumError) {
                    outputDisplay.textContent = `Lỗi Quantum API: ${quantumError.message}`;
                    return;
                }
                } else {
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
                    let lockEx = false;
                    // Kiểm tra nếu dòng hiện tại có 'bge' và ký tự thứ 3 không phải là số
                    if (lineContent.startsWith('bge')) {
                        const parts = lineContent.split(',');
                        const targetLabel = parts[2].trim();  // Lấy nhãn 'loop'
                        lockEx = true;
                        // Tìm kiếm dòng chứa nhãn và kết thúc bằng ":"
                        for (let i = currentLine - 1; i >= 0; i--) {
                            const prevLine = editor.getLine(i).trim();
                            if (prevLine.startsWith(targetLabel) && prevLine.endsWith(':')) {
                                currentLine = i;  // Đặt dòng tiếp theo sau nhãn để highlight
                                break;
                            }
                        }
                    }  
                    const logLines = storeLog.split('\n');
                    let capture = false;
                    if(!lockEx) {
                    // Lọc thông tin từ "done 31 - x" trở lên
                        for (let i = logLines.length - 1; i >= 0; i--) {
                            if (logLines[i].startsWith('done 31 -')) {
                                const match = logLines[i].match(/done 31 - (\d+)/);
                                if (match) {
                                    let logStep = parseInt(match[1], 10);
                                    // Nếu dòng kết thúc bằng ":", kích hoạt chế độ giữ stepCount - 1
                                    if (lineContent.endsWith(':')) {
                                        usePreviousStep = true;  // Bật chế độ giữ stepCount - 1
                                        previousStep = stepCount - 1;
                                        if (logStep === previousStep) {
                                            capture = true; 
                                        }  
                                        // Dừng thu thập khi logStep = previousStep - 1
                                        if (logStep === previousStep - 1) {
                                            capture = false;
                                        }
                                    }   else {
                                        // Nếu đã qua nhãn, giữ stepCount - 1
                                        if (usePreviousStep) {
                                            if (logStep === previousStep+1) {
                                                capture = true;
                                                previousStep++;  // Tiếp tục tăng dần log sau nhãn
                                            }
                                            if (logStep === previousStep-1) {
                                                capture = false;
                                            }
                                        } else {
                                            // Logic ban đầu (done 31 - stepCount)
                                            if (logStep === stepCount) {
                                                capture = true;
                                                //break;  // Dừng vòng lặp khi tìm thấy log
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
                        //outputDisplay.textContent = '';
                        // Kiểm tra nếu không có thông tin phù hợp
                        if (filteredLog.length === 0) {
                            outputDisplay.textContent = "Kết thúc. Không có dữ liệu phù hợp.";
                            stepButton.disabled = true;
                        } 
                        // else {
                        //     outputDisplay.textContent = `Step Count: ${stepCount}\n` +filteredLog.join('\n'); //`Step Count: ${stepCount}\n` + 
                        // }

            }
        } 
            if (currentLine >= totalLines - 1) {
                stepButton.disabled = true;
                currentLine = 0;  // Reset về đầu nếu đã đến dòng cuối
            } else {  
                currentLine++;
            }
            // Lưu vào localStorage
            localStorage.setItem('savedRegisterOutput', filteredLog.join('\n'));
            localStorage.setItem('stepCount', stepCount);
            //updateTabContent('/get_reg_output', filteredLog.join('\n'));
            const regTab = document.querySelector('.tab-link[data-endpoint="/get_reg_output"]');
            if (regTab.classList.contains('active')) {
                        outputDisplay.textContent = filteredLog.join('\n');
            }
            
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

    // Hàm hiển thị nội dung từ localStorage dựa vào tab đang chọn
    const showContentFromStorage = (apiEndpoint) => {
        if (apiEndpoint === '/get_reg_output') {
            const regOutput = localStorage.getItem('savedRegisterOutput');
            outputDisplay.textContent = regOutput || "Chưa có dữ liệu. Hãy nhấn Run.";
        } else if (apiEndpoint === '/get_mem_output') {
            const memOutput = localStorage.getItem('savedMemoryOutput');
            outputDisplay.textContent = memOutput || "Chưa có dữ liệu. Hãy nhấn Run.";
        } else if (apiEndpoint === '/run_code_quantum') {
            const quantumOutput = localStorage.getItem('savedQuantumOutput');
            outputDisplay.textContent = quantumOutput || "Chưa có dữ liệu. Hãy nhấn Run.";
        }
    };
    // Xử lý sự kiện nhấn vào các tab
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            // Bỏ class 'active' khỏi tất cả các tab
            tabs.forEach(t => t.classList.remove('active'));
            // Thêm class 'active' cho tab hiện tại
            event.currentTarget.classList.add('active');
            // Lấy endpoint tương ứng và hiển thị nội dung từ localStorage
            const apiEndpoint = event.currentTarget.getAttribute('data-endpoint');
            showContentFromStorage(apiEndpoint);
        });
    });
    // Hiển thị nội dung mặc định khi trang tải lần đầu
    const defaultTab = document.querySelector('.tab-link.active');
    if (defaultTab) {
        const defaultEndpoint = defaultTab.getAttribute('data-endpoint');
        showContentFromStorage(defaultEndpoint);
    }
});
