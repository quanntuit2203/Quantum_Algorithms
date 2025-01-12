document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('Ex-nums');
  const contentDisplay = document.getElementById('output-ex-display');
  const click = document.getElementById('run-ex-btn2');
  
  selector.addEventListener('change', () => {
    const selectedOption = selector.value;

    switch (selectedOption) {
        case 'op1':
            contentDisplay.textContent ='';
            click.addEventListener('click', () => {
              contentDisplay.textContent = `State: 00,  Probability: 1.0\nState: 01,  Probability: 0.0\nState: 10,  Probability: 0.0\nState: 11,  Probability: 0.0`
              ;});
            break;
        case 'op2':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 00, Probability: 0.0\nState: 01, Probability: 0.0\nState: 10, Probability: 0.0\nState: 11, Probability: 1.0`
            ;});
            break;
        case 'op3':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 0000, Probability: 1.0\nState: 0001, Probability: 0.0\nState: 0010, Probability: 0.0\nState: 0011, Probability: 0.0\nState: 0100, Probability: 0.0\nState: 0101, Probability: 0.0\nState: 0110, Probability: 0.0\nState: 0111, Probability: 0.0\nState: 1000, Probability: 0.0\nState: 1001, Probability: 0.0\nState: 1010, Probability: 0.0\nState: 1011, Probability: 0.0\nState: 1100, Probability: 0.0\nState: 1101, Probability: 0.0\nState: 1110, Probability: 0.0\nState: 1111, Probability: 0.0`
            ;});
            break;
        case 'op4':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 0000, Probability: 0.0\nState: 0001, Probability: 0.0\nState: 0010, Probability: 0.0\nState: 0011, Probability: 0.0\nState: 0100, Probability: 0.0\nState: 0101, Probability: 0.0\nState: 0110, Probability: 0.0\nState: 0111, Probability: 0.0\nState: 1000, Probability: 0.0\nState: 1001, Probability: 0.146\nState: 1010, Probability: 0.0\nState: 1011, Probability: 0.854\nState: 1100, Probability: 0.0\nState: 1101, Probability: 0.0\nState: 1110, Probability: 0.0\nState: 1111, Probability: 0.0
            `;});
            break;
        case 'op5':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 00, Probability: 1.0\nState: 01, Probability: 0.0\nState: 10, Probability: 0.0\nState: 11, Probability: 0.0`
            ;});
            break;
        default:
            contentDisplay.textContent = '';
    }
});

selector.dispatchEvent(new Event('change'));
});
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('Ex-nums');
  const contentDisplay = document.getElementById('ex-code-input');

  // Danh sách các từ cần tô đậm
  const wordList = ["reset", "write", "not", "cnot", "phase", "hadamard", "chadamard", "rotatex", "rotatey"];
  // Danh sách các số cần tô đậm
  const numList = ["0", "1", "2", "3", "4", "5", "8", "13", "14", "135", "180", "225", "360"];

  selector.addEventListener('change', () => {
      const selectedOption = selector.value;
      let contentText = '';

      switch (selectedOption) {
          case 'op1':
              contentText = `reset 2\nwrite 1\nnot 0\nmeasure `;
              break;
          case 'op2':
              contentText = `reset 2\nwrite 3\nphase 360 1\ncnot 1 0\nwrite 1\nmeasure`;
              break;
          case 'op3':
              contentText = `reset 5\nwrite 14\nhadamard 0\ncnot 3 0\ncnot 4 0\nchadamard 4 1\nchadamard 4 1\nreset 4\nmeasure`;
              break;
          case 'op4':
              contentText = `reset 4\nwrite 8\nrotatex 225 1\nwrite 4\nrotatex 180 3\nwrite 13\nphase 135 2\nmeasure`;
              break;
          case 'op5':
              contentText = `reset 2\nwrite 0\ncnot 1 0\nrotatey 360 0\nmeasure`;
              break;
          default:
              contentText = '';
      }

      const formattedContent = contentText.split('\n').map(line => {
          return line.split(/\s+/).map(word => {
              if (wordList.includes(word)) {
                  return `<span style="color: #FF0000">${word}</span>`;
              } else if (numList.includes(word)) {
                  return `<span style="color: #116644">${word}</span>`;
              } else if (word === 'measure') {
                  return word;
              } else {
                  return word;
              }
          }).join(' ');
      }).join('<br>');

      contentDisplay.innerHTML = formattedContent;
  });

  selector.dispatchEvent(new Event('change'));
});
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('Ex-nums');
  const contentDisplay = document.getElementById('output-ex-display');
  const click = document.getElementById('run-ex-btn2');
  
  selector.addEventListener('change', () => {
    const selectedOption = selector.value;

    switch (selectedOption) {
        case 'op1':
            contentDisplay.textContent ='';
            click.addEventListener('click', () => {
              contentDisplay.textContent = `State: 00, Probability: 1.0\nState: 01, Probability: 0.0\nState: 10, Probability: 0.0\nState: 11, Probability: 0.0`
              ;});
            break;
        case 'op2':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 00, Probability: 0.0\nState: 01, Probability: 0.0\nState: 10, Probability: 0.0\nState: 11, Probability: 1.0`
            ;});
            break;
        case 'op3':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 0000, Probability: 1.0\nState: 0001, Probability: 0.0\nState: 0010, Probability: 0.0\nState: 0011, Probability: 0.0\nState: 0100, Probability: 0.0\nState: 0101, Probability: 0.0\nState: 0110, Probability: 0.0\nState: 0111, Probability: 0.0\nState: 1000, Probability: 0.0\nState: 1001, Probability: 0.0\nState: 1010, Probability: 0.0\nState: 1011, Probability: 0.0\nState: 1100, Probability: 0.0\nState: 1101, Probability: 0.0\nState: 1110, Probability: 0.0\nState: 1111, Probability: 0.0`
            ;});
            break;
        case 'op4':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 0000, Probability: 0.0\nState: 0001, Probability: 0.0\nState: 0010, Probability: 0.0\nState: 0011, Probability: 0.0\nState: 0100, Probability: 0.0\nState: 0101, Probability: 0.0\nState: 0110, Probability: 0.0\nState: 0111, Probability: 0.0\nState: 1000, Probability: 0.0\nState: 1001, Probability: 0.146\nState: 1010, Probability: 0.0\nState: 1011, Probability: 0.854\nState: 1100, Probability: 0.0\nState: 1101, Probability: 0.0\nState: 1110, Probability: 0.0\nState: 1111, Probability: 0.0
            `;});
            break;
        case 'op5':
          contentDisplay.textContent ='';
          click.addEventListener('click', () => {
            contentDisplay.textContent = `State: 00, Probability: 1.0\nState: 01, Probability: 0.0\nState: 10, Probability: 0.0\nState: 11, Probability: 0.0`
            ;});
            break;
        default:
            contentDisplay.textContent = '';
    }
});

selector.dispatchEvent(new Event('change'));
});
