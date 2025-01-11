import numpy as np
import matplotlib.pyplot as plt

# Define the state |0^n>
def zero_state(n):
    state = np.zeros((2**n, 1))
    state[0, 0] = 1
    return state

# Define the Hadamard gate
def hadamard_gate(n):
    H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
    result = H
    for _ in range(n - 1):
        result = np.kron(result, H)
    return result

# Define the Oracle for the Deutsch-Jozsa algorithm
def deutsch_jozsa_oracle(n, balanced=True):
    oracle_matrix = np.eye(2**(n+1))  # Initialize the identity matrix
    if balanced:
        # Balanced function: f(x) = x1 XOR x2 XOR ... XOR xn
        for i in range(2**n):
            x = bin(i)[2:].zfill(n)  # Binary representation of i
            f_x = sum(int(bit) for bit in x) % 2  # Compute XOR
            if f_x == 1:
                # Swap |y>
                oracle_matrix[i * 2, i * 2 + 1] = 1
                oracle_matrix[i * 2 + 1, i * 2] = 1
                oracle_matrix[i * 2, i * 2] = 0
                oracle_matrix[i * 2 + 1, i * 2 + 1] = 0
    else:
        # Constant function: f(x) is always 0 or always 1
        f_x = np.random.choice([0, 1])  # Randomly choose constant f(x) as 0 or 1
        if f_x == 1:
            for i in range(2**n):
                oracle_matrix[i * 2, i * 2 + 1] = 1
                oracle_matrix[i * 2 + 1, i * 2] = 1
                oracle_matrix[i * 2, i * 2] = 0
                oracle_matrix[i * 2 + 1, i * 2 + 1] = 0
    return oracle_matrix

# Visualize results
def result_visualizer(result):
    if result == "Balanced":
        plt.bar(["00000"], [1], color="blue")
    else:
        plt.bar(["11111"], [1], color="red")
    plt.title("Deutsch-Jozsa Algorithm Result")
    plt.ylabel("Classification")
    plt.show()

# Simulate the Deutsch-Jozsa algorithm
def deutsch_jozsa_algorithm(n, balanced=True):
    # Initial input state |0^n>|1>
    psi = np.kron(zero_state(n), np.array([[0], [1]]))  # |0^n>|1>

    # Apply Hadamard on all qubits
    H_n = hadamard_gate(n)
    H_n1 = np.kron(H_n, hadamard_gate(1))
    psi = H_n1 @ psi

    # Apply Oracle
    Uf = deutsch_jozsa_oracle(n, balanced)
    psi = Uf @ psi

    # Apply Hadamard again on the first n qubits
    H_n1 = np.kron(H_n, np.eye(2))
    psi = H_n1 @ psi

    # Measure the state
    probability = np.abs(psi[:, 0])**2

    # Result of the Deutsch-Jozsa algorithm
    result = np.argmax(probability[:2**n])  # Measure only the first n qubits
    return "Constant" if result == 0 else "Balanced"

# Test the Deutsch-Jozsa algorithm
n = 5  # Number of qubits

# test1: balanced
result = deutsch_jozsa_algorithm(n, balanced=True)
print("Balanced case:", result)  # Expected "Balanced"
result_visualizer(result)

# test2: constant
result = deutsch_jozsa_algorithm(n, balanced=False)
print("Constant case:", result)  # Expected "Constant"
result_visualizer(result)
