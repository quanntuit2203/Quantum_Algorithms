document.addEventListener('DOMContentLoaded', (event) => {
    const codeInput = document.getElementById('code-input');
    const resetButton = document.getElementById('reset-btn');
    const runButton = document.getElementById('run-btn');
    const stepButton = document.getElementById('sbs-btn');
    const outputDisplay = document.getElementById('output-display');
    const downloadButton = document.getElementById('download-btn');
    const fileInput = document.getElementById('fileInput');
    const modeButton = document.getElementById('mode-btn');

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
    
    // Sự kiện khi có thay đổi trong CodeMirror
    editor.on('change', function () {
        highlightKeywords(editor);
        localStorage.setItem('savedCodeR', editor.getValue());
    });

    // Hàm để tô màu cú pháp cho các từ khóa
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

    // Gán sự kiện click cho nút reset
    // resetButton.addEventListener('click', function () {
    //     localStorage.removeItem('savedCodeR');
    //     localStorage.removeItem('savedMemoryOutput');
    //     localStorage.removeItem('savedRegisterOutput');
    //     //editor.setValue('');
    //     outputDisplay.textContent = '';
    //     currentIndex = 0;
    //     commands = [];
    //     removehighlightLineNumber();
    // });
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
        // Kích hoạt lại nút Step
        stepButton.disabled = false;
        // // Gửi yêu cầu reset đến server
        // try {
        //     const resetResponse = await fetch('http://127.0.0.1:5000/process_iss', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ reset: true })
        //     });
    
        //     if (!resetResponse.ok) {
        //         throw new Error('Không thể reset chương trình.');
        //     }
    
        //     const result = await resetResponse.json();
        //     outputDisplay.textContent = result.status;
        //     removehighlightLineNumber();
    
        // } catch (error) {
        //     outputDisplay.textContent = `Lỗi khi reset: ${error.message}`;
        // }
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
        // // Chuyển đổi chế độ 
        // if (currentMode === 'RISC-V') {
        //     currentMode = 'Quantum';
        //     window.location.href = '/home.html'; // Điều hướng đến trang Quantum
        // } else if (currentMode === 'Quantum') {
        //     currentMode = 'Mixed';
        //     window.location.href = '/Mixed.html'; // Điều hướng đến trang Mixed
        // } else if (currentMode === 'Mixed') {
        //     currentMode = 'RISC-V';
        //     window.location.href = '/RiscV.html'; // Quay lại trang RISC-V
        // } 
        modeButton.textContent = currentMode;
    });

    // // Gán sự kiện click cho nút run
    // runButton.addEventListener('click', async () => {
    //     const code = editor.getValue();  // Lấy giá trị từ CodeMirror
    //     //parseCommands(code);  // Giả định bạn có hàm này để phân tích các lệnh
    //     try {
    //         await fetch('http://127.0.0.1:5000/process_assembly', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ code: code}),
    //         });
    //         const response = await fetch('http://127.0.0.1:5000/get_binary_output');
    
    //         if (!response.ok) {
    //             throw new Error('Network response was not ok');
    //         }

    //         const result = await response.json();
    //         outputDisplay.textContent = result.output.join('\n');

    //         // Lưu output vào localStorage
    //         localStorage.setItem('savedOutputR', result.output.join('\n'));
    //     } catch (error) {
    //         outputDisplay.textContent = `Error: ${error.message}`;
    //     }
    // });
    
    // runButton.addEventListener('click', async () => {
    //     const code = editor.getValue(); // Lấy giá trị từ CodeMirror
    //     let regOutput = "";
    //     let memOutput = "";
    //     try {
    //         // Gửi yêu cầu đến process_assembly
    //         const assemblyResponse = await fetch('http://127.0.0.1:5000/process_assembly', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ code: code }),
    //         });
    
    //         if (!assemblyResponse.ok) {
    //             throw new Error('Failed to process assembly: ' + assemblyResponse.statusText);
    //         }
    
    //         // Gửi yêu cầu đến process_iss
    //         const issResponse = await fetch('http://127.0.0.1:5000/process_iss', {
    //             method: 'POST',
    //         });
    
    //         if (!issResponse.ok) {
    //             throw new Error('Failed to process ISS: ' + issResponse.statusText);
    //         }
    
    //         const issResult = await issResponse.json();
    //         // Hiển thị kết quả từ process_iss
    //         //outputDisplay.textContent += `\n\nISS Processing Complete:\n\nRegisters:\n${issResult.reg_output}\n\nMemory:\n${issResult.mem_output}\n\nDetails:\n${JSON.stringify(issResult, null, 2)}`;
    //         // Lưu kết quả ISS vào localStorage
    //         localStorage.setItem('savedOutputISS', JSON.stringify(issResult));


    //         // Sau khi process_iss, gọi tiếp get_reg_output
    //         const regResponse = await fetch('http://127.0.0.1:5000/get_reg_output');
    //         if (!regResponse.ok) {
    //             throw new Error('Failed to get register output: ' + regResponse.statusText);
    //         }
    //         const RegResult = await regResponse.json();
    //         regOutput = RegResult.output.join('\n');
    //         // Lưu binary output vào localStorage
    //         localStorage.setItem('savedRegisterOutput', regOutput);
    //          // Hiển thị thông tin Registers nếu đang ở tab Registers
    //         if (document.querySelector('.tab-link.active').getAttribute('data-endpoint') === '/get_reg_output') {
    //             outputDisplay.textContent = regOutput;
    //         }


    //         // Sau khi process_iss, gọi tiếp get_mem_output
    //         const memResponse = await fetch('http://127.0.0.1:5000/get_mem_output');
    //         if (!memResponse.ok) {
    //             throw new Error('Failed to get data memory output: ' + memResponse.statusText);
    //         }
    //         const MemResult = await memResponse.json();
    //         memOutput = MemResult.output.join('\n');
    //         // Lưu binary output vào localStorage
    //         localStorage.setItem('savedMemoryOutput', memOutput);
    //         // Hiển thị thông tin Memory nếu đang ở tab Data Memory
    //         if (document.querySelector('.tab-link.active').getAttribute('data-endpoint') === '/get_mem_output') {
    //             outputDisplay.textContent = memOutput;
    //         }
    //     } catch (error) {
    //         outputDisplay.textContent = `Error: ${error.message}`;
    //     }
    // });
    // runButton.addEventListener('click', async () => {
    //     const code = editor.getValue();
    //     // Kiểm tra nếu ô input trống
    //     if (!code.trim()) { 
    //         outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
    //         return; // Dừng thực thi nếu không có code
    //     }
    //     try {
    //         // Xử lý code và lưu kết quả
    //         await fetch('http://127.0.0.1:5000/process_assembly', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ code: code }),
    //         });
    
    //         await fetch('http://127.0.0.1:5000/process_iss', { 
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ mode: true })  // Truyền mode dưới dạng JSON
    //         });
    
    //         // Lấy dữ liệu từ get_reg_output
    //         const regResponse = await fetch('http://127.0.0.1:5000/get_reg_output');
    //         if (!regResponse.ok) throw new Error('Không thể lấy dữ liệu Register');
    //         const regResult = await regResponse.json();
    //         const regOutput = regResult.output.join('\n');
    //         localStorage.setItem('savedRegisterOutput', regOutput);
    
    //         // Lấy dữ liệu từ get_mem_output
    //         const memResponse = await fetch('http://127.0.0.1:5000/get_mem_output');
    //         if (!memResponse.ok) throw new Error('Không thể lấy dữ liệu Memory');
    //         const memResult = await memResponse.json();
    //         const memOutput = memResult.output.join('\n');
    //         localStorage.setItem('savedMemoryOutput', memOutput);
    
    //         // Cập nhật tab đang hoạt động
    //         const activeTab = document.querySelector('.tab-link.active');
    //         const activeEndpoint = activeTab.getAttribute('data-endpoint');
    //         if (activeEndpoint === '/get_reg_output') {
    //             outputDisplay.textContent = regOutput;
    //         } else if (activeEndpoint === '/get_mem_output') {
    //             outputDisplay.textContent = memOutput;
    //         }
    //     } catch (error) {
    //         outputDisplay.textContent = `Lỗi: ${error.message}`;
    //     }
    // });
    
    
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

    // Hàm tạo file TXT từ nội dung và tải xuống
    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    function highlightLineNumber(lineNumber) {
        // const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
        //     // Kiểm tra nếu số dòng lớn hơn số dòng thực tế hiện có
        // if (lineNumber > lineNumbers.length || lineNumber < 1) {
        //     console.warn("Dòng không tồn tại:", lineNumber);
        //     return;
        // }
        // // Xóa lớp được làm sáng trước đó
        // if (previousHighlightedLine !== null && lineNumbers[previousHighlightedLine]) {
        //     lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
        // }
        // // Làm sáng dòng hiện tại
        // if (lineNumbers[lineNumber - 1]) {  // lineNumber bắt đầu từ 1
        //     lineNumbers[lineNumber - 1].classList.add('highlighted-line-number');
        // }
        // // Cập nhật số dòng được làm sáng trước đó
        // previousHighlightedLine = lineNumber - 1;
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');

        // Xóa highlight tất cả các dòng
        lineNumbers.forEach((line) => {
            line.classList.remove('highlighted-line-number');
        });

        // Highlight dòng hiện tại
        if (lineNumber < lineNumbers.length) {
            lineNumbers[lineNumber].classList.add('highlighted-line-number');
        }
    }

    function removehighlightLineNumber() {
        // if (previousHighlightedLine !== null) {
        //     const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
        //     lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
        //     previousHighlightedLine = null;  // Đặt lại biến theo dõi highlight
        // }
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
        // Kiểm tra nếu ô input trống
        if (!code.trim()) { 
            outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
            return; // Dừng thực thi nếu không có code
        }
        try {
            // Xử lý code và lưu kết quả
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
                body: JSON.stringify({})  // Truyền mode dưới dạng JSON
            });
            
            if (!issResponse.ok) throw new Error('Không thể lấy dữ liệu từ process_iss');
            const issResult = await issResponse.json();
    
            const regOutput = issResult.registers;
            const memOutput = issResult.memory;
    
            localStorage.setItem('savedRegisterOutput', regOutput);
            localStorage.setItem('savedMemoryOutput', memOutput);
            // // Cập nhật tab đang hoạt động
            // const activeTab = document.querySelector('.tab-link.active');
            // const activeEndpoint = activeTab.getAttribute('data-endpoint');
            // if (activeEndpoint === '/get_reg_output') {
            //     outputDisplay.textContent = regOutput;
            // } else if (activeEndpoint === '/get_mem_output') {
            //     outputDisplay.textContent = memOutput;
            // }
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
            // await fetch('http://127.0.0.1:5000/process_assembly', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ code: code }),
            // });
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
            let filteredLog = [];
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
                outputDisplay.textContent = '';
                // Kiểm tra nếu không có thông tin phù hợp
                if (filteredLog.length === 0) {
                    outputDisplay.textContent = "Kết thúc. Không có dữ liệu phù hợp.";
                    stepButton.disabled = true;
                } else {
                    outputDisplay.textContent = `Step Count: ${stepCount}\n` +filteredLog.join('\n'); //`Step Count: ${stepCount}\n` + 
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

            // outputDisplay.textContent = `Step Count: ${stepCount}\n` + storeLog;
            // localStorage.setItem('savedRegisterOutput', storeLog);
            // localStorage.setItem('stepCount', stepCount);
        } catch (error) {
            outputDisplay.textContent = `Lỗi Assembly/RISC-V: ${error.message}`;
        }
    });
    // Vô hiệu hóa Step khi nội dung CodeMirror thay đổi
    // editor.on('change', () => {
    //     stepButton.disabled = true;
    //     outputDisplay.textContent = "Chỉnh sửa được thực hiện. Hãy nhấn Run sau đó Reset để kích hoạt lại Step.";
    // });
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