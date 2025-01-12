import numpy as np
import math as m
import operator
import time

class QuantumSimulator:
    def __init__(self) -> None:
        self.state = None
        self.num_qubits = 0

    def reset(self, num_qubits):
        self.num_qubits = num_qubits
        self.state = np.zeros((2 ** num_qubits,), dtype = complex)
        self.state[0] = 1 

    def apply_gate(self, gate, target_qubits):
        full_gate = np.eye(1)
        for qubit in range(self.num_qubits):
            if qubit in target_qubits:
                full_gate = np.kron(full_gate, gate)
            else:
                full_gate = np.kron(full_gate, np.eye(2))
        self.state = np.dot(full_gate, self.state)

    def not_gate(self, target_qubits):
        self.apply_gate(np.array([[0, 1], [1, 0]]), target_qubits)

    def hadamard(self, target_qubits):
        h_gate = (1 / np.sqrt(2)) * np.array([[1, 1], [1, -1]])
        self.apply_gate(h_gate, target_qubits)

    def phase_flip(self, target_qubits):
        z_gate = np.array([[1, 0], [0, -1]])
        self.apply_gate(z_gate, target_qubits)

    def measure_multiple(self, n_shots):
        probabilities = np.abs(self.state) ** 2
        results = np.random.choice(len(probabilities), n_shots, p=probabilities)
        frequency_count = {bin(i)[2:].zfill(self.num_qubits): 0 for i in range(2 ** self.num_qubits)}
        for result in results:
            frequency_count[bin(result)[2:].zfill(self.num_qubits)] += 1
        return frequency_count

def bin_to_dec(binary_number):
    return int(binary_number, 2)

# Khởi tạo trạng thái lượng tử
def initialize(N, s, string_w, simulator):
    for i in range(N):
        if string_w[i] == 1:
            simulator.not_gate([i])
    for i in range(N, N + s): 
        simulator.hadamard([i])
    return simulator

# Hàm Oracle đánh dấu trạng thái cần tìm
def oracle(N, M, simulator, pattern_p):
    for i in range(M):
        if pattern_p[i] == 0:
            simulator.not_gate([i])
    simulator.phase_flip([N - 1])  
    for i in range(M):
        if pattern_p[i] == 0:
            simulator.not_gate([i])
    return simulator

# Hàm khuếch đại biên độ (Diffusion function)
def diffusion(N, s, simulator):
    all_qubits = list(range(N + s))
    simulator.hadamard(all_qubits)
    simulator.not_gate(all_qubits)
    simulator.phase_flip([N + s - 1]) 
    simulator.not_gate(all_qubits)
    simulator.hadamard(all_qubits)
    return simulator

# Hàm chạy thuật toán Grover cho đến khi trạng thái 010 có xác suất cao nhất
def grover_search_until_target(string, pattern, n_shots = 100000):
    start_time = time.time()
    string_w = [int(x) for x in str(string)]
    pattern_p = [int(x) for x in str(pattern)]
    
    N = len(string_w)
    M = len(pattern_p)
    s = int(m.ceil(m.log2(N)))  # Số qubit ancilla

    target_state = "010" 
    found = False
    iteration = 0
    print('nshots:', n_shots)
    while not found:
        simulator = QuantumSimulator()
        simulator.reset(N + s)
        
        initialize(N, s, string_w, simulator)
        
        # Số lần lặp của thuật toán Grover
        k = round(m.pi / 4 * m.sqrt(2 ** s))
        
        # Áp dụng Oracle và Diffusion k lần
        for _ in range(k):
            oracle(N, M, simulator, pattern_p)
            diffusion(N, s, simulator)

        # Đo kết quả
        measurement_results = simulator.measure_multiple(n_shots)
        max_state = max(measurement_results.items(), key=operator.itemgetter(1))
        max_ancilla_state = max_state[0][-s:]
        
        if max_ancilla_state == target_state:
            found = True
            print(f"Iteration {iteration}:")
            print('Ancilla State\tOccurrence\tProbability')
            for state, count in measurement_results.items():
                ancilla_state = state[-s:]
                probability = (count / n_shots) * 100
                if probability > 1:
                    print(f"{ancilla_state}\t\t{count}\t\t{probability:.4f}%")
            print(f"\nAncilla state {target_state} with probability in iteration {iteration}.")
        
        iteration += 1

    end_time = time.time()
    print(f"Total execution time: {end_time - start_time:.4f} seconds")

#Testcase
string = "00110001" 
pattern = "11"   
print("Given String:", string)
print("Pattern:", pattern)
grover_search_until_target(string, pattern)
