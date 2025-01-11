import numpy as np

# Basic quantum gates
def hadamard():
    return np.array([[1, 1], [1, -1]]) / np.sqrt(2)

def pauli_x():
    return np.array([[0, 1], [1, 0]])

def pauli_z():
    return np.array([[1, 0], [0, -1]])

def cnot():
    return np.array([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 0]
    ])

# Applies a single gate to a quantum state
def apply_gate(gate, state):
    state = np.dot(gate, state)
    # Normalize the state
    norm = np.linalg.norm(state)
    if norm != 0:
        state = state / norm
    return state

# Tensor product of multiple qubit states
def tensor(*states):
    result = states[0]
    for state in states[1:]:
        result = np.kron(result, state)
    return result

# Basic states |0⟩ and |1⟩
zero = np.array([[1], [0]])  # |0⟩
one = np.array([[0], [1]])   # |1⟩

# Simulates a quantum measurement
def measure(state):
    probabilities = np.abs(state.flatten()) ** 2
    if not np.isclose(sum(probabilities), 1):
        raise ValueError("Probabilities do not sum to 1, state may not be normalized.")
    return np.random.choice(len(probabilities), p=probabilities)

# Oracle for Bernstein-Vazirani algorithm
def bernstein_vazirani_oracle(s):
    # Convert input string s to a list of integers
    s = [int(bit) for bit in s]
    n = len(s)
    U_f = np.eye(2**(n + 1))
    for x in range(2**n):
        # Compute f(x) = s ⋅ x (bitwise dot product modulo 2)
        y = sum((x >> i) & 1 for i, b in enumerate(s) if b) % 2
        if y:
            U_f[x, x + 2**n] = 1
            U_f[x + 2**n, x] = 1
    return U_f

# Bernstein-Vazirani algorithm
def bernstein_vazirani(s):
    # Convert input string s to a list of integers
    s = [int(bit) for bit in s]
    n = len(s)

    # Step 1: Prepare the initial state |0⟩^n |1⟩
    input_state = tensor(*([zero] * n), one)

    # Step 2: Apply Hadamard gate to all qubits
    H_n = tensor(*([hadamard()] * (n + 1)))  # n+1 Hadamard gates
    state = apply_gate(H_n, input_state)

    # Step 3: Apply the Oracle
    U_f = bernstein_vazirani_oracle(s)
    state = apply_gate(U_f, state)

    # Step 4: Apply Hadamard gate again (excluding the auxiliary qubit)
    H_n_minus_1 = tensor(*([hadamard()] * n), np.eye(2))  # Apply Hadamard only to the first n qubits
    state = apply_gate(H_n_minus_1, state)

    # Step 5: Measure the first n qubits to extract the hidden string s
    result = measure(state)
    return bin(result)[2:].zfill(n)  # Convert to binary and pad with zeros

# Execute the algorithm until the correct result is obtained
def run_until_correct(s):
    attempts = 0
    while True:
        attempts += 1
        result = bernstein_vazirani(s[::-1])  # Reverse the order of s for compatibility with indexing
        print(f"Attempt {attempts}: Measured {result}, Expected {s}")
        if result == s:  # Check if the result matches the hidden string
            print(f"Correct result after {attempts} attempts: {result}")
            break

# Test with the hidden string
s = '10110'  # Hidden bit string as a binary string
run_until_correct(s)
