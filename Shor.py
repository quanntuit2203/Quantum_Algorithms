import random
import numpy as np
from numpy import pi, exp


# Choose random number 'a'
def choose_a(N):
    return random.randint(2, N - 1)


# GCD
def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a


def hadamard(n):
    # Hadamard n state
    return np.ones(n) / np.sqrt(n)


# Find qubit count
def find_qubit_count(N):
    lower_bound = N ** 2
    upper_bound = 2 * N ** 2
    n = 1
    while 2 ** n <= lower_bound:
        n += 1
    return n if 2 ** n < upper_bound else n - 1


# Helper function to apply a phase rotation
def apply_phase_rotation(state, qubit_1, qubit_2, theta):
    """Simulates the controlled phase rotation between qubit_1 and qubit_2."""
    n = state.shape[0]
    for i in range(n):
        if (i >> qubit_1) & 1 and (i >> qubit_2) & 1:
            state[i] *= exp(1j * theta)
    return state


# Quantum Fourier Transform using Hadamard and Controlled-Phase gates
def quantum_fourier_transform(state):
    n_qubits = int(np.log2(state.shape[0]))  # Determine number of qubits from state size

    for qubit in range(n_qubits):
        # Apply Hadamard gate to the current qubit
        state = apply_hadamard(state, qubit)

        # Apply Controlled-Phase gates
        for j in range(1, n_qubits - qubit):
            theta = pi / (2 ** j)
            state = apply_phase_rotation(state, qubit, qubit + j, theta)

    # Swap qubits to reverse their order
    state = apply_swaps(state, n_qubits)

    return state


# Helper function to apply Hadamard to a specific qubit
def apply_hadamard(state, qubit):
    """Simulates a Hadamard gate on the specific qubit."""
    n = state.shape[0]
    for i in range(0, n, 2 ** (qubit + 1)):
        for j in range(2 ** qubit):
            idx1 = i + j
            idx2 = idx1 + 2 ** qubit

            # Apply Hadamard on |0⟩ and |1⟩ states
            temp = (state[idx1] + state[idx2]) / np.sqrt(2)
            state[idx2] = (state[idx1] - state[idx2]) / np.sqrt(2)
            state[idx1] = temp

    return state


# Helper function to swap qubits (reverse qubit order)
def apply_swaps(state, n_qubits):
    """Reverses the order of qubits (simulates SWAP gates)."""
    n = state.shape[0]
    for i in range(n):
        reversed_index = int('{:0{width}b}'.format(i, width=n_qubits)[::-1], 2)
        if reversed_index > i:
            state[i], state[reversed_index] = state[reversed_index], state[i]
    return state


# hadamard use in Uf transforms
def hadamard_uf(qubit_state):
    H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
    return np.dot(H, qubit_state)


# Helper function to apply CNOT
def cnot(control, target):
    if control == 1:
        return 1 - target
    return target


# Model function of Toffoli
def toffoli(control1, control2, target):
    if control1 == 1 and control2 == 1:
        return 1 - target
    return target


# Calculate a^x mod N with Hadamard, Toffoli and CNOT
def quantum_mod_exp(a, N, x):
    # Quibit ancilla Y - store states
    qubit_y = 0  # Init states 0

    # Apply Hadamard to qubit |x⟩
    qubit_x = np.array([1, 0]) if x == 0 else np.array([0, 1])
    qubit_x = hadamard_uf(qubit_x)

    # Model using quantum gates
    for i in range(len(qubit_x)):
        if qubit_x[i] == 1:
            # Apply CNOT from |x⟩ to qubit ancilla
            qubit_y = cnot(qubit_x[i], qubit_y)

            # Apply Toffoli to control qubit |x⟩
            qubit_y = toffoli(qubit_x[i], qubit_y, qubit_y)

    # After execute with quantum gates, ancilla y store the result
    result = (a ** x) % N  # compare with true result
    # print(qubit_y)

    return qubit_y, result


# Modular Exponentiation using quantum gates (simulated as controlled unitary)
def modular_exponentiation_quantum(a, N, n_states):
    state = np.zeros((n_states, N), dtype=complex)
    for x in range(n_states):
        qubit_y, result = quantum_mod_exp(a, N, x)
        state[x, result] += 1.0 / np.sqrt(n_states)
    return state


# Measure probabilities (quantum measurement)
def measure(probabilities):
    return np.random.choice(len(probabilities), p=probabilities)


# Shor's Algorithm with quantum gates simulation
def shor_to_N(N, max_retries=10):
    for attempt in range(max_retries):
        a = choose_a(N)

        # Total state of qubit
        n_states = 2 ** find_qubit_count(N)

        # Step 1: Initial Hadamard to create superposition of states
        initial_state = hadamard(n_states)

        # Step 2: Apply Uf: f(x) = a^x mod N (Quantum Modular Exponentiation)
        state = modular_exponentiation_quantum(a, N, n_states)

        # Step 3: Combine |𝑥⟩ state with f(x) state
        combined_state = np.zeros((n_states, N), dtype=complex)
        for i in range(n_states):
            combined_state[i, np.argmax(state[i])] += initial_state[i]

        # Step 4: Measure f(x)
        probabilities = np.abs(combined_state.sum(axis=0)) ** 2
        probabilities /= probabilities.sum()
        measured_value = measure(probabilities)
        print(f"Value in second register: {measured_value}")

        # Step 5: Apply Quantum Fourier Transform (QFT)
        fourier_transform = quantum_fourier_transform(combined_state[:, measured_value])

        # Find the most probable value in the Fourier transformed state
        probabilities_ft = np.abs(fourier_transform) ** 2
        probabilities_ft /= probabilities_ft.sum()
        measured_ft = measure(probabilities_ft)
        print(f"Measure value after Fourier: {measured_ft}")

        # Step 6: Estimate the period r
        C = measured_ft
        Q = n_states
        r_estimate = Q // gcd(C, Q)
        print(f"Period r: {r_estimate}")

        # Step 7: Find factors of N
        if r_estimate is not None:
            p = gcd(pow(a, r_estimate // 2, N) - 1, N)
            if p == 1 or p == N:
                print(f"Attempt {attempt + 1}: p = 1 or p = N, retrying...")
                continue  # Retry if p is trivial

            q = N // p
            if q != 1:
                print(f"Factoring number of N: {p} & {q}")
                return p, q
            else:
                print(f"Attempt {attempt + 1}: q = 1, retrying...")

    print(f"Failed to factorize N = {N} after {max_retries} attempts.")
    return None


# Input
N = 143
shor_to_N(N)
