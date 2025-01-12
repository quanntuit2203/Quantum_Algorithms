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

    let currentIndex = 0;
    let commands = [];
    let previousHighlightedLine = null;

    // Kiểm tra và tải dữ liệu từ localStorage cho Quantum
    if (localStorage.getItem('savedCodeQ')) {
        editor.setValue(localStorage.getItem('savedCodeQ'));
    }
    if (localStorage.getItem('savedOutputQ')) {
        outputDisplay.textContent = localStorage.getItem('savedOutputQ');
    }

    editor.on('change', function () {
        highlightKeywords(editor);
        localStorage.setItem('savedCodeQ', editor.getValue());
    });

    // tô màu cú pháp cho các từ khóa
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

    //reset
    resetButton.addEventListener('click', function () {
        localStorage.removeItem('savedCodeQ');
        localStorage.removeItem('savedOutputQ');
        //editor.setValue('');
        outputDisplay.textContent = '';
        currentIndex = 0;
        commands = [];
        removehighlightLineNumber();
    });

    let currentMode = 'Quantum';

    //mode
    modeButton.addEventListener('click', () => {
        if (currentMode === 'Quantum') {
            // Lưu dữ liệu Quantum trước khi chuyển sang RISC-V
            const currentCode = editor.getValue();
            const currentOutput = outputDisplay.textContent;
            localStorage.setItem('savedCodeQ', currentCode);
            localStorage.setItem('savedOutputQ', currentOutput);
        }
        modeButton.textContent = currentMode;
    });

    //run
    runButton.addEventListener('click', async () => {
        localStorage.removeItem('savedOutputQ');
        currentIndex = 0;
        commands = [];
        removehighlightLineNumber();
        const code = editor.getValue();
        if (!code.trim()) { 
            outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
            return;
        }
        try {
            const response = await fetch('http://127.0.0.1:5000/run_code_quantum', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code, mode: 1 }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            outputDisplay.textContent = result.output;

            // Lưu output vào localStorage
            localStorage.setItem('savedOutputQ', result.output);
        } catch (error) {
            outputDisplay.textContent = `Error: ${error.message}`;
        }
    });

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                editor.setValue(content);
            };
            reader.readAsText(file);
        }
    });

    // Download
    downloadButton.addEventListener('click', function() {
        const outputContent = outputDisplay.textContent;
        downloadFile('output_result.txt', outputContent);
    });

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    function highlightLineNumber(lineNumber) {
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
        if (previousHighlightedLine !== null && lineNumbers[previousHighlightedLine]) {
            lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
        }
        if (lineNumbers[lineNumber - 1]) {  // lineNumber bắt đầu từ 1
            lineNumbers[lineNumber - 1].classList.add('highlighted-line-number');
        }
        previousHighlightedLine = lineNumber - 1;
        if (lineNumber === lineNumbers.length) {
            Toastify({
                text: "Complete",         // Văn bản thông báo
                duration: 2000,           // Thời gian hiển thị là 3 giây
                newWindow: true,          // Khi nhấn vào thông báo, mở trong cửa sổ mới
                close: true,              // Cho phép đóng thông báo
                gravity: "top",           // Vị trí hiển thị thông báo ở trên cùng của màn hình
                position: "center",       // Vị trí hiển thị ở giữa theo trục ngang
                stopOnFocus: true,        // Giữ thông báo khi chuột di qua
                style: {
                    background: "linear-gradient(to right, #57c7d4, #5056d7)", // Màu nền gradient từ xanh dương đến tím
                    color: "white",          // Màu chữ trắng
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', // Thêm đổ bóng mạnh mẽ
                    borderRadius: '8px',     // Bo góc của thông báo
                    fontSize: '18px',        // Tăng kích thước chữ lên 18px
                    fontWeight: 'bold',      // Đặt phông chữ đậm
                    padding: '12px 24px',    // Tăng đệm cho thông báo
                    textAlign: 'center'      // Căn giữa văn bản
                }
            }).showToast();
            return true;
        }
        return false;
    }

    function removehighlightLineNumber() {
        if (previousHighlightedLine !== null) {
            const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
            lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
            previousHighlightedLine = null;
        }
    }

    //step
    stepButton.addEventListener('click', async () => {
        const code2 = editor.getValue();
        parseCommands(code2);
        if (currentIndex >= commands.length) {
            return;
        }
        const code = commands[currentIndex];
        currentIndex++;
        const isCompleted = highlightLineNumber(currentIndex);
        if (isCompleted) return;
        try {
            const response = await fetch('http://127.0.0.1:5000/run_code_quantum', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code, mode: 2 }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            outputDisplay.textContent = result.output;

            highlightLineNumber(currentIndex);
            localStorage.setItem('savedOutputQ', result.output);
            
        } catch (error) {
            outputDisplay.textContent = `Error: ${error.message}`;
        }
    });

    function parseCommands(code) {
        commands = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
});
