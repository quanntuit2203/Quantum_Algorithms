// document.addEventListener('DOMContentLoaded', (event) => {
//     const codeInput = document.getElementById('code-input');
//     const resetButton = document.getElementById('reset-btn');
//     const runButton = document.getElementById('run-btn');
//     const stepButton = document.getElementById('sbs-btn');
//     const outputDisplay = document.getElementById('output-display'); 
//     const downloadButton = document.getElementById('download-btn');
//     const fileInput = document.getElementById('fileInput');
//     // Khởi tạo CodeMirror
//     const editor = CodeMirror.fromTextArea(codeInput, {
//         lineNumbers: true,  // Hiển thị số dòng
//         mode: "javascript"  // Chế độ chỉnh sửa: JavaScript
        
//     });

//     let currentIndex = 0;
//     let commands = [];
//     let previousHighlightedLine = null;

//     // Sự kiện khi có thay đổi trong CodeMirror
//     editor.on('change', function() {
//         highlightKeywords(editor);  // Gọi hàm để tô màu cú pháp
//     });

//     // Hàm để tô màu cú pháp cho các từ khóa
//     function highlightKeywords(editor) {
//         const keywords = ['reset', 'write', 'not', 'cnot', 'hadamard', 'chadamard', 'swap', 'phase', 'rotatex', 'rotatey'];
//         const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

//         editor.eachLine((line) => {
//             const lineNumber = editor.getLineNumber(line);
//             const lineText = line.text;
//             const matches = [...lineText.matchAll(regex)];

//             matches.forEach((match) => {
//                 editor.markText(
//                     { line: lineNumber, ch: match.index },
//                     { line: lineNumber, ch: match.index + match[0].length },
//                     { className: 'highlighted' }
//                 );
//             });
//         });
//     }

//     // Gán sự kiện click cho nút reset
//     resetButton.addEventListener('click', function() {
//         //editor.setValue(''); // Xóa toàn bộ nội dung trong CodeMirror
//         //editor.setCursor({line: 0, ch: 0}); // Đưa con trỏ về đầu trang
//         //editor.clearHistory(); // Xóa lịch sử undo/redo
//         //editor.refresh(); // Làm mới CodeMirror để áp dụng các thay đổi
//         currentIndex = 0; // Đặt lại chỉ mục lệnh
//         commands = []; // Xóa các lệnh hiện tại
//         removehighlightLineNumber();
//     });

//     // Gán sự kiện click cho nút run
//     runButton.addEventListener('click', async () => {
//         const code = editor.getValue(); // Lấy giá trị từ CodeMirror
//         parseCommands(code); // Giả định bạn có hàm này để phân tích các lệnh
//         try {
//             const response = await fetch('http://127.0.0.1:5000/run_code', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ code: code, mode: 1 }), 
//             });

//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }

//             const result = await response.json();
//             outputDisplay.textContent = result.output;
//         } catch (error) {
//             outputDisplay.textContent = `Error: ${error.message}`;
//         }
//     });
    
//     // Gán sự kiện tải file và hiển thị nội dung trong CodeMirror
//     fileInput.addEventListener('change', function(event) {
//         const file = event.target.files[0]; // Lấy tệp đầu tiên
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = function(e) {
//                 const content = e.target.result; // Lấy nội dung file
//                 editor.setValue(content); // Đưa nội dung vào CodeMirror
//             };
//             reader.readAsText(file); // Đọc tệp dưới dạng văn bản
//         }
//     });
//     // Sự kiện khi người dùng nhấn nút Download
//     downloadButton.addEventListener('click', function() {
//         const outputContent = outputDisplay.textContent;  // Lấy nội dung từ outputDisplay
//         downloadFile('output_result.txt', outputContent);  // Gọi hàm để tải file xuống
//     });

//     // Hàm tạo file TXT từ nội dung và tải xuống
//     function downloadFile(filename, content) {
//         const blob = new Blob([content], { type: 'text/plain' });
//         const link = document.createElement('a');
//         link.href = URL.createObjectURL(blob);
//         link.download = filename;
//         link.click();
//     }
    
//     function highlightLineNumber(lineNumber) {
//         const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
//         // Xóa lớp được làm sáng trước đó
//         if (previousHighlightedLine !== null && lineNumbers[previousHighlightedLine]) {
//             lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
//         }
//         // Làm sáng dòng hiện tại
//         if (lineNumbers[lineNumber - 1]) {  // lineNumber bắt đầu từ 1
//             lineNumbers[lineNumber - 1].classList.add('highlighted-line-number');
//         }
//         // Cập nhật số dòng được làm sáng trước đó
//         previousHighlightedLine = lineNumber - 1;
//         // Kiểm tra nếu là dòng cuối cùng
//         if (lineNumber === lineNumbers.length) {
//             Toastify({
//                 text: "Complete",         // Văn bản thông báo
//                 duration: 2000,           // Thời gian hiển thị là 3 giây
//                 newWindow: true,          // Khi nhấn vào thông báo, mở trong cửa sổ mới
//                 close: true,              // Cho phép đóng thông báo
//                 gravity: "top",           // Vị trí hiển thị thông báo ở trên cùng của màn hình
//                 position: "center",       // Vị trí hiển thị ở giữa theo trục ngang
//                 stopOnFocus: true,        // Giữ thông báo khi chuột di qua
//                 style: {
//                     background: "linear-gradient(to right, #57c7d4, #5056d7)", // Màu nền gradient từ xanh dương đến tím
//                     color: "white",          // Màu chữ trắng
//                     boxShadow: '0 4px 12px rgba(0,0,0,0.3)', // Thêm đổ bóng mạnh mẽ
//                     borderRadius: '8px',     // Bo góc của thông báo
//                     fontSize: '18px',        // Tăng kích thước chữ lên 18px
//                     fontWeight: 'bold',      // Đặt phông chữ đậm
//                     padding: '12px 24px',    // Tăng đệm cho thông báo
//                     textAlign: 'center'      // Căn giữa văn bản
//                 }
//             }).showToast();
//             // Ngăn chặn việc tiếp tục khi đã đến dòng cuối cùng
//             return true;
//         }
//         return false;
//     }
//     function removehighlightLineNumber(lineNumber){
//         if (previousHighlightedLine !== null) {
//             const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
//             lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
//             previousHighlightedLine = null;  // Đặt lại biến theo dõi highlight
//         }
//     }

//     // Gán sự kiện click cho nút step
//     stepButton.addEventListener('click', async () => {
//         const code2 = editor.getValue();
//         parseCommands(code2);
//         if (currentIndex >= commands.length) {
//             return;
//         }
//         const code = commands[currentIndex];
//         currentIndex++;
//         // Gọi hàm highlightLineNumber và kiểm tra nếu là dòng cuối cùng
//         const isCompleted = highlightLineNumber(currentIndex);
//         if (isCompleted) return;
//         try {
//             const response = await fetch('http://127.0.0.1:5000/run_code', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ code: code, mode: 2 }),
//             });

//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }

//             const result = await response.json();
//             outputDisplay.textContent = result.output;

//             highlightLineNumber(currentIndex);
//         } catch (error) {
//             outputDisplay.textContent = `Error: ${error.message}`;
//         }
//     });
//     function parseCommands(code) {
//         commands = code.split('\n').map(line => line.trim()).filter(line => line !== '');
//     }
// });
    
// document.getElementById('reset-btn').addEventListener('click', () => {
//     document.getElementById('output-display').textContent = '';
//     document.getElementById('run-btn').classList.remove('disabled-button');
//     document.getElementById('sbs-btn').classList.remove('disabled-button');
// });
// document.getElementById('run-btn').addEventListener('click', () => {
//     document.getElementById('run-btn').classList.remove('disabled-button');  // Bỏ mờ cho nút Run nếu nó đang bị mờ
// });

// document.getElementById('sbs-btn').addEventListener('click', () => {
//     document.getElementById('run-btn').classList.add('disabled-button');  // Làm mờ nút Run
//     document.getElementById('sbs-btn').classList.remove('disabled-button');  // Bỏ mờ cho nút Step nếu nó đang bị mờ
// });
// function showNotification() {
//     const notification = document.getElementById('notification');
//     notification.style.display = 'block';

//     setTimeout(() => {
//         notification.style.display = 'none';
//     }, 3000);  // ẩn sau 5 giây
// }
// function closeNotification() {
//     const notification = document.getElementById('notification');
//     notification.style.display = 'none';
// }
// showNotification();

//---------------------------------------------------------------------------------------------------------------//


// document.getElementById('run-btn').addEventListener('click', async () => {
//     const code = document.getElementById('code-input').value;
//     parseCommands(code);
//     try {
//         const response = await fetch('http://127.0.0.1:5000/run_code', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ code: code, mode: 1 }), 
//         });

//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }

//         const result = await response.json();
//         document.getElementById('output-display').textContent = result.output;
//     } catch (error) {
//         document.getElementById('output-display').textContent = `Error: ${error.message}`;
//     }
// });






// function updateLineNumbers() {
//     const codeInput = document.getElementById('code-input');
//     const lineNumbers = document.getElementById('line-numbers');
//     const lines = codeInput.value.split('\n').length;
//     lineNumbers.innerHTML = '';
//     for (let i = 1; i <= lines; i++) {
//         const lineNumber = document.createElement('div');
//         lineNumber.textContent = i;
//         lineNumbers.appendChild(lineNumber);
//     }
// }

// function syncScroll() {
//     const codeInput = document.getElementById('code-input');
//     const lineNumbers = document.getElementById('line-numbers');
//     lineNumbers.scrollTop = codeInput.scrollTop;
// }

// // Initialize line numbers on page load
// updateLineNumbers();
// let currentLine = 0;

// function highlightNextLineNumber() {
//     const lineNumbers = document.getElementById('line-numbers').children;
//     if (currentLine < lineNumbers.length) {
//         if (currentLine > 0) {
//             lineNumbers[currentLine - 1].classList.remove('highlight');
//         }
//         lineNumbers[currentLine].classList.add('highlight');
//         currentLine++;
//     } else {
//         alert('Done');
//     }
// }
// function resetHighlight() {
//     const lineNumbers = document.getElementById('line-numbers').children;
//     for (let i = 0; i < lineNumbers.length; i++) {
//         lineNumbers[i].classList.remove('highlight');
//     }
//     currentLine = 0;
// }
// document.getElementById('sbs-btn').addEventListener('click', highlightNextLineNumber);
// document.getElementById('reset-btn').addEventListener('click', resetHighlight);
//---------------------------------------------------------------------------------------------------------------//
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

    // Sự kiện khi có thay đổi trong CodeMirror
    editor.on('change', function () {
        highlightKeywords(editor);
        localStorage.setItem('savedCodeQ', editor.getValue());
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

    // Gán sự kiện click cho nút reset
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

    // Gán sự kiện click cho nút chuyển đổi chế độ
    modeButton.addEventListener('click', () => {
        if (currentMode === 'Quantum') {
            // Lưu dữ liệu Quantum trước khi chuyển sang RISC-V
            const currentCode = editor.getValue();
            const currentOutput = outputDisplay.textContent;
            localStorage.setItem('savedCodeQ', currentCode);
            localStorage.setItem('savedOutputQ', currentOutput);
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

    // Gán sự kiện click cho nút run
    runButton.addEventListener('click', async () => {
        localStorage.removeItem('savedOutputQ');
        currentIndex = 0;
        commands = [];
        removehighlightLineNumber();
        const code = editor.getValue();  // Lấy giá trị từ CodeMirror
        if (!code.trim()) { 
            outputDisplay.textContent = "Chưa có input nên không thể chạy chương trình";
            return; // Dừng thực thi nếu không có code
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
        const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
        // Xóa lớp được làm sáng trước đó
        if (previousHighlightedLine !== null && lineNumbers[previousHighlightedLine]) {
            lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
        }
        // Làm sáng dòng hiện tại
        if (lineNumbers[lineNumber - 1]) {  // lineNumber bắt đầu từ 1
            lineNumbers[lineNumber - 1].classList.add('highlighted-line-number');
        }
        // Cập nhật số dòng được làm sáng trước đó
        previousHighlightedLine = lineNumber - 1;

        // Kiểm tra nếu là dòng cuối cùng
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

            // Ngăn chặn việc tiếp tục khi đã đến dòng cuối cùng
            return true;
        }
        return false;
    }

    function removehighlightLineNumber() {
        if (previousHighlightedLine !== null) {
            const lineNumbers = document.querySelectorAll('.CodeMirror-linenumber');
            lineNumbers[previousHighlightedLine].classList.remove('highlighted-line-number');
            previousHighlightedLine = null;  // Đặt lại biến theo dõi highlight
        }
    }

    // Gán sự kiện click cho nút step
    stepButton.addEventListener('click', async () => {
        const code2 = editor.getValue();
        parseCommands(code2);
        if (currentIndex >= commands.length) {
            return;
        }
        const code = commands[currentIndex];
        currentIndex++;
        // Gọi hàm highlightLineNumber và kiểm tra nếu là dòng cuối cùng
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
            localStorage.setItem('savedOutputQ', result.output);  // Lưu output vào localStorage
            
        } catch (error) {
            outputDisplay.textContent = `Error: ${error.message}`;
        }
    });

    function parseCommands(code) {
        commands = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
});
