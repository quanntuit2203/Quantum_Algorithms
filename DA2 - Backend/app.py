from flask import Flask, request, jsonify, render_template
import numpy as np
import os
from flask_cors import CORS
from dic_case import *
from dic_func357 import *
from dic_reg_csr import *
from name_dic_mem import *
from dic_mem_adr import *
from dic_mem_adr_read import *
from dic_mem_adr_write import *
from mem_a import *
from all_name_dic_mem import *
from all_dic_mem_adr import *
from all_dic_mem_adr_read import *
from all_dic_mem_adr_write import *
from all_mem_a import *
from dict_funR import *
from dict_reg import *

app = Flask(__name__)
CORS(app)
imem_read   = [0]*262143
imem_write  = [0]*262143
imem_sum    = [0]*262143
ireg_read   = [0]*32
ireg_write  = [0]*32
isum_reg    = [0]*32
branch      = 0
dont_branch = 0
jumped      = 0
dont_jump   = 0
imm_array           = []
RegDestSourceALU = []
RegAllArray      = []
branch_forward  = 0
branch_back     = 0
jump_over    = 0
jump_back    = 0
current_line = 0
start_line   = 0 
number_command = 0
branch_jump_loop = 0 
branch_loop = False
link_mem = []
state = {
    "sum_line": 0,
    "current_line": 0,
    "start_line": 0,
    "branch_jump_loop": 0,
    "branch_loop": False,
    "branch_forward": 0,
    "branch_back": 0,
    "jump_over": 0,
    "jump_back": 0,
}
current_state = {
                "current_line": 0,
                "start_line": 0,
                "number_command": 0,
                "branch_jump_loop": 0,
                "branch_loop": False,
                "branch_forward": 0,
                "branch_back": 0,
                "jump_over": 0,
                "jump_back": 0,
                "is_completed": False,
                "file_content": [],
                "sum_line": 0  
                } 
class ISS:
    def check_32bit(self, value):
        count = len(value)
        if count < 32:
            if value.startswith('1'):
                value = value.rjust(32,'1')
            else:
                value = value.zfill(32)
        else:
            pass
        return value
    def add_bin(self, value1, value2):
        result = ''
        carry = 0
        maxlen = max(len(value1),len(value2))
        value1 = value1.zfill(maxlen)
        value2 = value2.zfill(maxlen)
        i = maxlen - 1
        while(i >= 0):
            if value1[i] == '\u202c' or value2[i] == '\u202c':
                pass
            else:
                s = int(value1[i]) + int(value2[i])
                if s == 2: # 1 + 1:
                    if carry == 0:
                        carry = 1
                        result  = '0' + result
                    else:
                        carry = 1
                        result  = '1' + result
                elif s == 1: # 1 + 0 :
                    if carry == 1:
                        result = '0' + result
                        carry = 1
                    else:
                        result = '1' + result
                elif s == 0: # 0 + 0 :
                    if carry == 0:
                        result = '0' + result
                    else:
                        result = '1' + result
                        carry = 0
            i = i - 1
        return result  
    def sub_bin(self, value1, value2):
        result = ''
        carry = 0
        maxlen = max(len(value1),len(value2))
        value1 = value1.zfill(maxlen)
        value2 = value2.zfill(maxlen)
        i = maxlen - 1
        while(i >= 0):
            if value1[i] == '\u202c' or value2[i] == '\u202c':
                pass
            else:
                s = int(value1[i]) - int(value2[i])
                if s == 0: # 1 - 1:
                    if carry == 0:
                        carry = 0
                        result  = '0' + result
                    else:
                        carry = 1
                        result  = '1' + result
                elif s == 1: # 1 - 0 :
                    if carry == 1:
                        result = '0' + result
                        carry = 0
                    else:
                        result = '1' + result
                elif s == -1: # 0 - 1 :
                    if carry == 0:
                        result = '1' + result
                        carry = 1
                    else:
                        result = '0' + result
                        carry = 1
            i = i - 1
        return result  
    def xor_bin(self, value1, value2):
        result = ''
        maxlen = max(len(value1),len(value2))
        value1 = value1.zfill(maxlen)
        value2 = value2.zfill(maxlen)
        i = maxlen - 1
        while(i >= 0):
            if value1[i] == '\u202c' or value2[i] == '\u202c':
                pass
            else:
                s = int(value1[i]) + int(value2[i])
                if s == 2: # 1 + 1:
                    result  = '0' + result
                elif s == 1: # 1 + 0 :
                    result = '1' + result
                elif s == 0: # 0 + 0 :
                        result = '0' + result
            i = i - 1
        return result   
    def or_bin(self, value1, value2):
        result = ''
        maxlen = max(len(value1),len(value2))
        value1 = value1.zfill(maxlen)
        value2 = value2.zfill(maxlen)
        i = maxlen - 1
        while(i >= 0):
            if value1[i] == '\u202c' or value2[i] == '\u202c':
                pass
            else:
                s = int(value1[i]) + int(value2[i])
                if s == 2: # 1 + 1:
                    result  = '1' + result
                elif s == 1: # 1 + 0 :
                    result = '1' + result
                elif s == 0: # 0 + 0 :
                    result = '0' + result
            i = i - 1
        return result
    def and_bin(self, value1, value2):
        result = ''
        maxlen = max(len(value1),len(value2))
        value1 = value1.zfill(maxlen)
        value2 = value2.zfill(maxlen)
        i = maxlen - 1
        while(i >= 0):
            if value1[i] == '\u202c' or value2[i] == '\u202c':
                pass
            else:
                s = int(value1[i]) + int(value2[i])
                if s == 2: # 1 + 1:
                    result  = '1' + result
                elif s == 1: # 1 + 0 :
                    result = '0' + result
                elif s == 0: # 0 + 0 :
                    result = '0' + result
            i = i - 1
        return result
    def shift_bit_right_logical(self, value_need_shift, value_shift):
        value = value_need_shift
        while(value_shift > 0):
            value = '0' + value[0:31]
            value_shift = value_shift - 1
        return value 
    def shift_bit_left_logical(self, value_need_shift, value_shift):
        value = value_need_shift
        while(value_shift > 0):
            value       = value[1:32] + '0' 
            value_shift = value_shift - 1
        return value
    def shift_bit_right_arithmetic(self, value_need_shift, value_shift):### giá trị vào là chuỗi nha
        value = value_need_shift
        while(value_shift > 0):
            value = value[31] + value[0:31]
            value_shift = value_shift - 1 
        return value ## gía trị outt là chuỗi rồi
    def positive(self, value):
        return int(value, 2)  # Chuyển nhị phân sang số nguyên 
    def signed2(self, str_bit):
        value_out = ''
        out_last  = ''
        number    = 0
        select_last = 0
        for i in str_bit:
            if i == '1':
                value_out = value_out + i.replace('1', '0')
                select_last = number
            else:
                value_out = value_out + i.replace('0', '1')
            number += 1
        out_last = value_out[:select_last]
        for i in value_out[select_last:]:
            if i == '1':
                out_last  = out_last + i.replace('1', '0')
            else:
                out_last = out_last + i.replace('0', '1')
        out_last = out_last[:32]
        out_last = self.positive(out_last)     
        return -out_last
    def check_signed_positive(self, value): ### giá trị đầu vào là chuỗi
        if value.startswith('1'):
            out = self.signed2(value)
        else:
            out = self. positive(value)
        return out
    def change_to_bin(self, value):
        value       = bin(value)
        number_b    = value.find("b")
        int(number_b)
        out         = value[number_b+1:]
        return out
    def reg_read(self, bit_reg):
        int_reg             = dict_reg[bit_reg] 
        ireg_read[int_reg]   = ireg_read[int_reg] + 1
        return 
    def reg_write(self, bit_reg):
        int_reg             = dict_reg[bit_reg]
        ireg_write[int_reg]  = ireg_write[int_reg] + 1
        return 
    
    def mem_read(self, int_mem):
        global link_mem
        link_mem.append(int_mem)
        imem_read[int_mem] = imem_read[int_mem] + 1
        return
    def mem_write(self, int_mem):
        imem_write[int_mem] = imem_write[int_mem] + 1
        return
    def take_adress(self, bit_in):
        if bit_in[25:32] == '0000011':
            imm         = bit_in[:12]
            rs          = bit_in[12:17]
            imm                 = self.positive(imm)
            rs_tamp             = dict_reg[rs]
            rs_tamp             = reg_list[rs_tamp]
            rs_tamp             = self.positive(rs_tamp)
            address_mem         = int(((imm + rs_tamp)/4))
        else:
            imm_8bit    = bit_in[0:7]
            rs          = bit_in[7:12]
            imm_4bit    = bit_in[20:25]
            imm         = imm_8bit + imm_4bit
            imm         = self.positive(imm)
            rs_tamp                   = dict_reg[rs]
            rs_tamp                   = reg_list[rs_tamp]
            rs_tamp                   = self.positive(rs_tamp)
            address_mem               = int(((imm + rs_tamp)/4))
        return address_mem 
    def take_imm(self, imm_dec): # giá trị đưa vào là immadate đã chuyển sang dec 
        imm_array.append(imm_dec)
        return imm_array
    def add(self, rd,rs1,rs2):
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs1]
        rt_tamp             = dict_reg[rs2]
        result              = self.add_bin(reg_list[rs_tamp],reg_list[rt_tamp])
        reg_list[rd_tamp]   = result
        print("ran comand add")
        return result
    def sub(self, rd,rs1,rs2):
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs1]
        rt_tamp             = dict_reg[rs2]
        result              = self.sub_bin(reg_list[rs_tamp],reg_list[rt_tamp])
        reg_list[rd_tamp]   = result
        print("ran comand sub")
        return result
    def sll(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        value_shift             = self.check_signed_positive(reg_list[rs2_tamp])
        result                  = self.shift_bit_left_logical(reg_list[rs1_tamp],value_shift)
        reg_list[rd_tamp]       = result
        print("ran comand sll")
        return                    result
    def slt(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        value_rs2               = self.check_signed_positive(reg_list[rs2_tamp])
        value_rs1               = self.check_signed_positive(reg_list[rs1_tamp])
        if value_rs1 <  value_rs2:
            result              = "1"
            result              = result.rjust(32,"0")
        else:
            result              = "0"
            result              = result.zfill(32)
        reg_list[rd_tamp]       = result
        print("ran comand ")
        return                  result
    def sltu(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        value_rs2               = self.check_signed_positive(reg_list[rs2_tamp])
        value_rs1               = self.check_signed_positive(reg_list[rs1_tamp])
        if value_rs1 <  value_rs2:
            result              = "1"
            result              = result.rjust(32,"0")
        else:
            result              = "0"
            result              = result.zfill(32)
        reg_list[rd_tamp]       = result
        print("ran command sltu")
        return                  result
    def xor(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        result                  = self.xor_bin(reg_list[rs1_tamp], reg_list[rs2_tamp])
        reg_list[rd_tamp]       = result
        print("ran command xor")
        return                  result
    def srl(self, rd,rs1,rs2):
        result = '0'
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        print(reg_list[rs1_tamp])
        print(reg_list[rs2_tamp])
        value_shift             = self.check_signed_positive(reg_list[rs2_tamp])
        if value_shift <= 31:
            result                  = self.shift_bit_right_logical(reg_list[rs1_tamp],value_shift)
            reg_list[rd_tamp]       = result
        else:
            pass
        reg_list[rd_tamp]       = result
        print("co ket qua")
        print("ran command srl")
        return                    result

    def sra(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        value_shift             = self.check_signed_positive(reg_list[rs2_tamp])
        if value_shift <= 31:
            result                  = self.shift_bit_right_arithmetic(reg_list[rs1_tamp],value_shift)
            reg_list[rd_tamp]       = result
        else :
            value_shift = 31
            result                  = self.shift_bit_right_arithmetic(reg_list[rs1_tamp],value_shift)
            reg_list[rd_tamp]       = result
        print("ran command sra")
        return                    result
    def or_bit(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        result                  = self.or_bin(reg_list[rs1_tamp],reg_list[rs2_tamp])
        reg_list[rd_tamp]       = result
        print(result)
        print("ran command or")
        return                    result
    def and_bit(self, rd,rs1,rs2):
        rd_tamp                 = dict_reg[rd]
        rs1_tamp                = dict_reg[rs1]
        rs2_tamp                = dict_reg[rs2]
        result                  = self.and_bin(reg_list[rs1_tamp],reg_list[rs2_tamp])
        reg_list[rd_tamp]       = result
        print("ran command and")
        return                    result
    ############## xong các hàm của R format ##########3
    def addi(self, imm,rd,rs):# giá trị trong 
        rd_tamp         = dict_reg[rd]
        rs1_tamp        = dict_reg[rs]
        imm             = self.check_32bit(imm)
        imm_re          = self.check_signed_positive(imm)
        self.take_imm(imm_re)
        print(rd_tamp)
        print(reg_list[rs1_tamp])
        result          = self.add_bin(imm,reg_list[rs1_tamp])
        reg_list[rd_tamp]    = self.check_32bit(result)
        print("ran comand addi")
        print(reg_list[rd_tamp])
        return reg_list[rd_tamp]
    def SLTI(self, imm,rs,rd):
        imm_tamp = self.check_signed_positive(imm)
        self.take_imm(imm_tamp)
        rs_tamp  = self.check_signed_positive(rs)
        rd_tamp  = dict_reg[rd]
        if rs_tamp < imm_tamp :
            result = '1'
            reg_list[rd_tamp] = result.rjust(32,'0') 
        else:
            result = '0'
            reg_list[rd_tamp] = result.zfill(32)
        print("ran comand SLTI")
        return reg_list[rd_tamp]
    def SLTIU(self, imm,rs,rd):
        imm      = self.check_32bit(imm)
        imm_tamp = self.positive(imm)
        self.take_imm(imm_tamp)
        rs_tamp  = dict_reg[rs]
        rd_tamp  = dict_reg[rd]
        if rs_tamp < imm_tamp :
            result = '1'
        else:
            result = '0'
        reg_list[rd_tamp] = result.zfill(32)
        print("ran comand SLTIU")
        return reg_list[rd_tamp]
    def xori(self, imm,rs,rd):
        imm         = self.check_32bit(imm)
        self.take_imm(self.check_signed_positive(imm))
        rd_tamp     = dict_reg[rd]
        rs_tamp     = dict_reg[rs]
        rs_tamp     = reg_list[rs_tamp]    
        result = self.xor_bin(imm,rs_tamp)
        reg_list[rd_tamp] = self.check_32bit(result)
        print("ran comand xori")
        return reg_list[rd_tamp]
    def ori(self, imm,rs,rd):
        print(imm)
        imm                 = self.check_32bit(imm)
        print(imm)
        self.take_imm(self.check_signed_positive(imm))
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs]
        rs_tamp             = reg_list[rs_tamp]
        print(imm)
        print(rs_tamp)
        result              = self.or_bin(imm,rs_tamp)
        print(result)
        reg_list[rd_tamp]   = self.check_32bit(result)
        print("ran comand ori")
        return reg_list[rd_tamp]
    def andi(self, imm,rs,rd):
        imm                 = self.check_32bit(imm)
        self.take_imm(self.check_signed_positive(imm))
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs]
        rs_tamp             = reg_list[rs_tamp]
        result              = self.and_bin(imm,rs_tamp)
        reg_list[rd_tamp]   = self.check_32bit(result)
        print("ran comand andi")
        return reg_list[rd_tamp]
    def slli(self, imm,rs,rd):
        shamt               = imm[7:]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs]
        value_shift         = self.positive(shamt)
        self.take_imm(value_shift)
        result              = self.shift_bit_left_logical(reg_list[rs_tamp],value_shift)
        reg_list[rd_tamp]   = result
        print("ran comand slli")
        return reg_list[rd_tamp]
    def srli(self, imm,rs,rd):
        shamt               = imm[7:]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs]
        value_shift         = self.positive(shamt)
        self.take_imm(value_shift)
        result              = self.shift_bit_right_logical(reg_list[rs_tamp],value_shift)
        reg_list[rd_tamp]   = result
        print("ran command srli")
        return reg_list[rd_tamp]
    def srai(self, imm,rs,rd):
        shamt               = imm[7:]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = dict_reg[rs]
        value_shift         = self.positive(shamt)
        self.take_imm(value_shift)
        result              = self.shift_bit_right_arithmetic(reg_list[rs_tamp],value_shift)
        reg_list[rd_tamp]   = result
        print("gia tri dc ship nhe %s"%(str(result)))
        print("ran command srai")
        return reg_list[rd_tamp]
    def lr_w(self, rd,rs1,rs2):
        rd_tamp             = dict_reg[rd]
        rs1_tamp            = dict_reg[rs1]
        print(rs1_tamp)
        value_rs1           = reg_list[rs1_tamp]
        value_rs1           = self.positive(value_rs1)
        print(value_rs1)
        address_mem         = int(((value_rs1)/4))
        self.mem_read(address_mem)
        result              = mem_list[address_mem]
        reg_list[rd_tamp]   = result
        print("ran command Lr.w")
        return result
    def sc_w(self, rd,rs1,rs2):
        global link_mem
        rd_tamp             = dict_reg[rd]
        rs1_tamp            = dict_reg[rs1]
        rs2_tamp            = dict_reg[rs2]
        value_rs1           = reg_list[rs1_tamp]
        value_rs1           = self.positive(value_rs1)
        address_mem         = int(value_rs1/4)
        if address_mem in link_mem:
            result              = mem_list[address_mem]
            reg_list[rs2_tamp]  = result
            self.add_bin(reg_list[rd_tamp], "0")
        else:
            self.add_bin(reg_list[rd_tamp], "1")
        return result
    ##################### xong các hàm của I format ###############
    def lw(self, imm,rs,rd):
        imm                 = self.positive(imm)
        self.take_imm(imm)
        rs_tamp             = dict_reg[rs]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = reg_list[rs_tamp]
        rs_tamp             = self.positive(rs_tamp)
        print(rs_tamp)
        print(imm)
        address_mem         = int(((imm + rs_tamp)/4))
        print(address_mem)
        self.mem_read(address_mem)
        result              = mem_list[address_mem]
        reg_list[rd_tamp]   = result
        print("ran command LW")
        return result
    def lb(self, imm,rs,rd):
        imm                 = self.positive(imm)
        self.take_imm(imm)
        rs_tamp             = dict_reg[rs]
        rs_tamp             = reg_list[rs_tamp]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = self.positive(rs_tamp)
        address_mem         = int(((imm + rs_tamp)/4))
        self.mem_read(address_mem)
        result              = mem_list[address_mem]
        result              = result[24:]
        result              = self.check_32bit(result)
        reg_list[rd_tamp]   = result
        print("ran comand lb")
        return result
    def lh(self, imm,rs,rd):
        imm                 = self.positive(imm)
        self.take_imm(imm)
        rs_tamp             = dict_reg[rs]
        rs_tamp             = reg_list[rs_tamp]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = self.positive(rs_tamp)
        address_mem         = int(((imm + rs_tamp)/4))
        self.mem_read(address_mem)
        result              = mem_list[address_mem]
        result              = result[16:]
        result              = self.check_32bit(result)
        reg_list[rd_tamp]   = result
        print("ran comand lh")
        return result
    def lbu(self, imm,rs,rd):
        imm                 = self.positive(imm)
        self.take_imm(imm)
        rs_tamp             = dict_reg[rs]
        rs_tamp             = reg_list[rs_tamp]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = self.positive(rs_tamp)
        address_mem         = int(((imm + rs_tamp)/4))
        self.mem_read(address_mem)
        result              = mem_list[address_mem]
        result              = result[24:]
        result              = result.rjust(32,'0')
        reg_list[rd_tamp]   = result
        print("ran comand lbu")
        return result
    def lhu(self, imm,rs,rd):
        imm                 = self.positive(imm)
        self.take_imm(imm)
        rs_tamp             = dict_reg[rs]
        rs_tamp             = reg_list[rs_tamp]
        rd_tamp             = dict_reg[rd]
        rs_tamp             = self.positive(rs_tamp)
        address_mem         = int(((imm + rs_tamp)/4))
        self.mem_read(address_mem)
        result              = mem_list[address_mem]
        result              = result[16:]
        result              = result.rjust(32,'0')
        reg_list[rd_tamp]   = result
        return result
    ######### kết thúc các hàm cho I format #####################
    def sw(self, imm,rs,rd):
        imm                       = self.positive(imm)
        self.take_imm(imm)
        rs_tamp                   = dict_reg[rs]
        rs_tamp                   = reg_list[rs_tamp]
        rd_tamp                   = dict_reg[rd]
        rs_tamp                   = self.check_signed_positive(rs_tamp)
        address_mem               = int(((imm + rs_tamp)/4))
        print(address_mem)
        self.mem_write(address_mem)
        result                    = reg_list[rd_tamp]
        mem_list[address_mem]     = result
        print("ran comand sw")
        return result
    def sh(self, imm,rs,rd):
        imm                       = self.positive(imm)
        self.take_imm(imm)
        rs_tamp                   = dict_reg[rs]
        rs_tamp                   = reg_list[rs_tamp]
        rd_tamp                   = dict_reg[rd]
        print(rs_tamp)
        rs_tamp                   = self.check_signed_positive(rs_tamp)
        print(rs_tamp)
        address_mem               = int(((imm + rs_tamp)/4))
        print(address_mem)
        self.mem_write(address_mem)
        result                    = reg_list[rd_tamp][16:]
        mem_list[address_mem]     = result.rjust(32,'0')
        return result
    def sb(self, imm,rs,rd):
        imm                       = self.positive(imm)
        self.take_imm(imm)
        rs_tamp                   = dict_reg[rs]
        rs_tamp                   = reg_list[rs_tamp]
        rd_tamp                   = dict_reg[rd]
        rs_tamp                   = self.check_signed_positive(rs_tamp)
        print(imm)
        print(rs_tamp)
        address_mem               = int(((imm + rs_tamp)/4))
        print(address_mem)
        self.mem_write(address_mem)
        result                    = reg_list[rd_tamp][24:]
        mem_list[address_mem]     = result.rjust(32,'0')
        return result
    ################ xong các lệnh trong S format ###############
    def beq(self, rs,rt,imm):
        start_row       = 0
        must_jump       = 0
        rs_tamp         = dict_reg[rs]
        rt_tamp         = dict_reg[rt]
        rs_tamp         = reg_list[rs_tamp]
        rt_tamp         = reg_list[rt_tamp]
        rs_tamp         = self.check_signed_positive(rs_tamp)
        rt_tamp         = self.check_signed_positive(rt_tamp)                                    
        if rs_tamp      ==      rt_tamp:
            jump_row    = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row   = jump_row
            must_jump   = 1
            print("ran the command Beq")
        else:
            print("dont run command beq")
            pass
        return must_jump,start_row
    def bne(self, rs,rt,imm):
        start_row       = 0
        must_jump       = 0
        rs_tamp         = dict_reg[rs]
        rt_tamp         = dict_reg[rt]
        rs_tamp         = reg_list[rs_tamp]
        rt_tamp         = reg_list[rt_tamp]
        rs_tamp         = self.check_signed_positive(rs_tamp)
        rt_tamp         = self.check_signed_positive(rt_tamp)          
        if rs_tamp     !=      rt_tamp:
            jump_row    = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row   = jump_row
            must_jump   = 1
            print("ran the command bne")
        else:
            print("Dont run command bne")
            pass
        return must_jump,start_row
    def blt(self, rs,rt,imm):
        start_row       = 0
        must_jump       = 0
        rs_tamp         = dict_reg[rs]
        rt_tamp         = dict_reg[rt]
        rs_tamp         = reg_list[rs_tamp]
        rt_tamp         = reg_list[rt_tamp]
        rs_tamp         = self.check_signed_positive(rs_tamp)
        rt_tamp         = self.check_signed_positive(rt_tamp)     
        if rs_tamp     <= rt_tamp:
            jump_row    = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row   = jump_row
            must_jump   = 1
            print("ran the command blt")
        else:
            print("dont run command blt")
            pass
        return must_jump,start_row
    def bge(self, rs,rt,imm):
        start_row       = 0
        must_jump       = 0
        rs_tamp         = dict_reg[rs]
        rt_tamp         = dict_reg[rt]
        rs_tamp         = reg_list[rs_tamp]
        rt_tamp         = reg_list[rt_tamp]
        rs_tamp         = self.check_signed_positive(rs_tamp)
        rt_tamp         = self.check_signed_positive(rt_tamp)     
        if rs_tamp     >= rt_tamp:
            jump_row    = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row   = jump_row
            must_jump   = 1    
            print("ran the command bge")
        else:
            print("dont run command bge")
            pass
        return must_jump,start_row
    def bltu(self, rs,rt,imm):
        start_row       = 0
        must_jump       = 0
        rs_tamp         = dict_reg[rs]
        rt_tamp         = dict_reg[rt]
        rs_tamp         = reg_list[rs_tamp]
        rt_tamp         = reg_list[rt_tamp]
        rs_tamp         = self.positive(rs_tamp)
        rt_tamp         = self.positive(rt_tamp)     
        if rs_tamp     <= rt_tamp:
            jump_row    = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row   = jump_row
            must_jump   = 1   
            print("run command bltu")
        else:
            print("dont run command bltu")
            pass
        return must_jump,start_row
    def bgeu(self, rs,rt,imm):
        start_row       = 0
        must_jump       = 0
        rs_tamp         = dict_reg[rs]
        rt_tamp         = dict_reg[rt]
        rs_tamp         = reg_list[rs_tamp]
        rt_tamp         = reg_list[rt_tamp]
        rs_tamp         = self.positive(rs_tamp)
        rt_tamp         = self.positive(rt_tamp)     
        if rs_tamp     >= rt_tamp:
            jump_row    = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row   = jump_row
            print(start_row)
            must_jump   = 1 
            print("ran command bgeu")
        else:
            print("dont ran command bgeu")
            pass
        return must_jump,start_row
    ##################### xong các lệnh trong SB format ######################
    def jal(self, rd,imm,current_line): # nhớ jalr dùng thanh ghi rd lưu giá trị pc+4 cộng 12 bit vào cho đủ 32, còn jal chỉ lưu 20 bit thôi à
        must_jump           = 1
        jump_row            = self.check_signed_positive(imm)
        self.take_imm(jump_row)
        start_row           = jump_row
        result              = self.change_to_bin(current_line)
        rd_tamp             = dict_reg[rd]
        if rd_tamp          != 0:
            reg_list[rd_tamp]   = result.rjust(32,'0') 
        else:
            reg_list[rd_tamp]   = "00000000000000000000000000000000"
        print("ran the command jal")
        return must_jump,start_row
    def jalr(self, rd,imm,current_line,pc_array):
        start_row       = 0
        must_jump       = 0
        if pc_array[current_line] <=100:
            jump_row            = self.check_signed_positive(imm)
            self.take_imm(jump_row)
            start_row           = jump_row
            result              = self.change_to_bin(current_line)
            rd_tamp             = dict_reg[rd]
            reg_list[rd_tamp]   = result.ljust(32,'0')
            must_jump           = 1
            print("ran the command jalr")
        else:
            must_jump           = 0
            pass
        #break
        return must_jump,start_row
    #################### Xong các lệnh UJ Format #############################
    def lui(self, rd,imm):
        rd_tamp             = dict_reg[rd]
        result              = imm.rjust(32,'0')
        imm_tamp            = self.check_signed_positive(imm)
        self.take_imm(imm_tamp)
        result              = self.shift_bit_left_logical(result, 12)
        reg_list[rd_tamp]   = result
        print("ran the command lui")
        return result
    def auipc(self, rd,imm,current_line):
        imm_tamp                = imm.rjust(32,'0')
        imm_tamp2               = self.shift_bit_left_logical(imm_tamp, 12)
        self.take_imm(imm_tamp2)
        pc_adress               = self.change_to_bin(current_line)
        result                  = self.add_bin(imm_tamp2,pc_adress)
        reg_list[dict_reg[rd]]  = result
        print("ran the command auipc")
        return result
    ###################### Xong các lệnh U format ##############################@#####
    ####################################### I1_FORMAT  #################################
    def I1_format(self, bit_in):
        imm         = bit_in[:12]
        rs          = bit_in[12:17]
        rd          = bit_in[20:25]
        funct3      = bit_in[17:20]
        switch = {
            '000' : 'lb',
            '001' : 'lh',
            '010' : 'lw',
            '100' : 'lbu',
            '101' : 'lhu'
            }
        select = switch.get(funct3)
        if select == 'lb':
            out_I1_format = self.lb(imm, rs, rd)
        elif select == 'lh':
            out_I1_format = self.lh(imm, rs, rd)
        elif select == 'lw':
            out_I1_format = self.lw(imm, rs, rd)
        elif select == 'lbu':
            out_I1_format = self.lbu(imm, rs, rd)
        elif select == 'lhu':
            out_I1_format = self.lhu(imm, rs, rd)
        else:
            print("funtion does not exist")
        self.reg_read(rs)
        self.reg_write(rd)
        print("Done I1")
        return out_I1_format
    ####################################### I2_format  ################################
    def I2_format(self, bit_in):
        bit_se = bit_in[1]
        imm         = bit_in[:12]
        rd          = bit_in[12:17]
        rs          = bit_in[20:25]
        func3       = bit_in[17:20]
        switch = {
            '000' : 'addi',
            '010' : 'slti',
            '011' : 'sltiu',
            '100' : 'xori',
            '110' : 'ori',
            '111' : 'andi',
            '001' : 'slli',
            '101' : 'srl_ai'
            }
        select = switch.get(func3)
        if select == 'addi':
            out_I2_format = self.addi(imm, rs, rd)
        elif select == 'slti':
            out_I2_format = self.SLTI(imm, rs, rd)
        elif select == 'sltiu':
            out_I2_format = self.SLTIU(imm, rs, rd)
        elif select == 'xori':
            out_I2_format = self.xori(imm, rs, rd)
        elif select == 'ori':
            out_I2_format = self.ori(imm, rs, rd)
        elif select == 'andi':
            out_I2_format = self.andi(imm, rs, rd)
        elif select == 'slli':
            out_I2_format = self.slli(imm, rs, rd)
        elif select == 'srl_ai':
            print(bit_se)
            if bit_se != 1:
                out_I2_format = self.srai(imm, rs, rd)
            else:
                out_I2_format = self.srli(imm, rs, rd)
        else:
            print("funtion does not exist")
        self.reg_read(rs)
        self.reg_write(rd)
        print("done I2")
        return out_I2_format
    ####################################### S_FORMAT   #################################
    def S_format(self, bit_in):
        j           = 0
        b           = 0
        imm_8bit    = bit_in[0:7]
        rs          = bit_in[7:12]
        rd          = bit_in[12:17]
        width       = bit_in[17:20]
        imm_4bit    = bit_in[20:25]
        imm         = imm_8bit + imm_4bit
        must_jump   = 0
        switch = {
            '000'   : 'sb',
            '001'   : 'sh',
            '010'   : 'sw'
            }
        select = switch.get(width)
        if select   == 'sb':
            out_def = self.sb(imm, rd, rs)
        elif select == 'sh':
            out_def = self.sh(imm, rd, rs)
        elif select == 'sw':
            out_def = self.sw(imm,rd,rs)
        else:
            print("funtion does not exist")
        self.reg_read(rd)
    ### không có ghi dữ liệu ra thanh ghi
        print("DONE S")
        return must_jump,out_def,j,b
    ####################################### SB_FORMAT #################################
    def SB_FORMAT(self, bit_in):
        j   = 0
        b   = 0
        global branch
        global dont_branch
        must_jump   = 0
        imm_12      = bit_in[0]
        imm_10_5    = bit_in[1:7]
        rt          = bit_in[7:12]
        rs          = bit_in[12:17]
        funct3      = bit_in[17:20]
        imm_4_1     = bit_in[20:24] 
        imm_11      = bit_in[25]
        imm         = imm_12 + imm_10_5 + imm_4_1 + imm_11        
        switch      = {
            '000'   : 'beq',
            '001'   : 'bne',
            '100'   : 'blt',
            '101'   : 'bge',
            '110'   : 'bltu',
            '111'   : 'bgeu'
            }
        select = switch.get(funct3)
        if select   == 'beq':
            must_jump,out_def = self.beq(rs, rt, imm)
        elif select == 'bne':
            must_jump,out_def = self.bne(rs, rt, imm)
        elif select == 'blt':
            must_jump,out_def = self.blt(rs, rt, imm)
        elif select == 'bge':
            must_jump,out_def = self.bge(rs, rt, imm)
        elif select == 'bltu':
            must_jump,out_def = self.bltu(rs, rt, imm)
        elif select == 'bgeu':
            must_jump,out_def = self.bgeu(rs, rt, imm)
        else:
            print("funtion does not exist")
        if must_jump == 1:
            branch  = branch + 1
            b       = 1
        else:
            dont_branch = dont_branch + 1
        self.reg_read(rs)
        self.reg_read(rt)
        return must_jump,out_def,j,b
    ####################################### R _ FORMAT #################################
    def R1_format(self, bit_in):
        must_jump   = 0
        j           = 0
        b           = 0
        funct7      = bit_in[0:7]
        rs2         = bit_in[7:12]
        rs1         = bit_in[12:17]
        funct3      = bit_in[17:20]
        rd          = bit_in[20:25]
        operations  = funct7 + funct3
        switcher    = {
                '0000000000' : 'add',
                '0100000000' : 'sub',
                '0000000001' : 'sll',
                '0000000010' : 'slt',
                '0000000011' : 'sltu',
                '0000000100' : 'xor',
                '0000000101' : 'srl',
                '0100000101' : 'sra',
                '0000000110' : 'or',
                '0000000111' : 'and'
            }
        select      =  switcher.get(operations)
        if select   == 'add':
            out_def     = self.add(rd, rs1, rs2) 
        elif select == 'sub':
            out_def     = self.sub(rd, rs1, rs2)
        elif select == 'sll':
            out_def     = self.sll(rd, rs1, rs2)
        elif select == 'slt':
            out_def     = self.slt(rd, rs1, rs2)
        elif select == 'sltu':
            out_def     = self.sltu(rd, rs1, rs2)
        elif select == 'xor':
            out_def     = self.xor(rd, rs1, rs2)
        elif select == 'srl':
            print("vao toi day")
            out_def     = self.srl(rd, rs1, rs2)
        elif select == 'sra':
            out_def     = self.sra(rd, rs1, rs2)
        elif select == 'or':
            out_def     = self.or_bit(rd, rs1, rs2)
        elif select == 'and':
            out_def     = self.and_bit(rd, rs1, rs2)
        else:
            print("funtion does not exist")
        self.CheckRegSource(rs1,rs2)
        self.CheckRegAll(rd,rs1,rs2)
        self.reg_read(rs1)
        self.reg_read(rs2)
        self.reg_write(rd)
        return must_jump,out_def,j,b
    def R2_format(self, bit_in):
        must_jump   = 0
        j           = 0
        b           = 0
        funct5      = bit_in[0:5]
        print(funct5)
        rs2         = bit_in[7:12]
        rs1         = bit_in[12:17]
        funct3      = bit_in[17:20]
        print(funct3)
        rd          = bit_in[20:25]
        operations  = funct5 + funct3
        switcher    = {
                '00010010' : 'lr.w',
                '00011010' : 'sc.w',
            }
        select      =  switcher.get(operations)
        print(select)
        if select   == 'lr.w':
            out_def     = self.lr_w(rd, rs1, rs2) 
        elif select == 'sc.w':
            out_def     = self.sc_w(rd, rs1, rs2)
        else:
            print("funtion does not exist")
        self.CheckRegSource(rs1,rs2)
        self.CheckRegAll(rd,rs1,rs2)
        self.reg_read(rs1)
        self.reg_read(rs2)
        self.reg_write(rd)
        return must_jump,out_def,j,b
    ################## DONE R ######################
    ################## DO I FORMAT #################
    def I_format(self, bit_in):
        must_jump = 0
        j       = 0
        b       = 0
        switcher = {
                '0000011' : 'I1_format',
                '0010011' : 'I2_format'
            }   
        c = switcher.get(bit_in[25:32])
        if c == 'I1_format':
            out_I_format = self.I1_format(bit_in)
        else:
            out_I_format = self.I2_format(bit_in)
        return must_jump,out_I_format,j,b
    ################# DONE I #####################
    def U_format(self, bit_in,current_line):
        must_jump   = 0
        j           = 0
        b           = 0
        imm     = bit_in[0:20]
        rd      = bit_in[20:25]
        opcode  = bit_in[25:32] 
        switch  = {
            '0010111'   : 'auipc',
            '0110111'   : 'lui'
            }
        select = switch.get(opcode)
        if select == 'auipc':
            out_def = self.auipc(rd, imm, current_line)
        elif select == 'lui':
            out_def = self.lui(rd, imm)
        else:
            print("funtion does not exist")
        self.reg_write(rd)
        return must_jump,out_def,j,b
    def UJ_format(self, bit_in,current_line,pc_array):
        j           = 1
        b           = 0
        global jumped
        start_row       = 0
        bit_20          = bit_in[0]
        bit_10_1        = bit_in[1:11]
        bit_11          = bit_in[12]
        bit_19_12       = bit_in[12:20]
        rd              = bit_in[20:25]
        imm             = bit_20 + bit_19_12 + bit_11 + bit_10_1
        opcode          = bit_in[25:32]
        switch          = {
            '1101111'   : 'jal',
            '1100111'   : 'jalr'
            }
        select          = switch.get(opcode)
        if select       == 'jal':
            must_jump,start_row     = self.jal(rd, imm, current_line)
        elif select     == 'jalr':
            must_jump,start_row     = self.jalr(rd, imm, current_line,pc_array)
        else:
            print("funtion does not exist")
        jumped = jumped + 1
        self.reg_write(rd)
        return must_jump,start_row,j,b
    def check_opcode(self, bit_in,current_line,pc_array): 
        out_def = ''
        switcher={
            '0000011' 	: 'I-type', # lb
            '0010011'   : 'I-type', # addi
            '0010111'   : 'U-type',
            '0110111'   : 'U-type',
            '1101111'   : 'UJ-type',
            '1100111'   : 'UJ-type',
            '0100011'   : 'S-type',
            '0110011'   : 'R1-type',
            '0101111'   : 'R2-type',
            '1100011'   : 'SB-type'
            }
        select      =  switcher.get(bit_in[25:32])
        print(select)
        if select   == 'R1-type':
            must_jump,out_def,j,b = self.R1_format(bit_in)
        elif select == 'R2-type':
            must_jump,out_def,j,b = self.R2_format(bit_in)
        elif select ==  'I-type':
            must_jump,out_def,j,b = self.I_format(bit_in)
        elif select == 'U-type':
            must_jump,out_def,j,b = self.U_format(bit_in,current_line)   
        elif select == 'S-type':
            must_jump,out_def,j,b = self.S_format(bit_in)
        elif select == 'UJ-type':
            must_jump,out_def,j,b = self.UJ_format(bit_in, current_line,pc_array)
            current_line = 1
        elif select == 'SB-type':
            must_jump,out_def,j,b = self.SB_FORMAT(bit_in)
            current_line = 1
        print("here")
        print("dang o day")
        return must_jump,out_def,j,b   
    def CheckRegSource(self, bit_in1,bit_in2):
        rs1 = dict_reg[bit_in1]
        rs2 = dict_reg[bit_in2]
        if rs1 == rs2:
            RegDestSourceALU.append(rs1)
        else:
            pass
        return RegDestSourceALU
    def CheckRegAll(self, rd,rs1,rs2):
        rd  = dict_reg[rd]
        rs1 = dict_reg[rs1]
        rs2 = dict_reg[rs2]
        if rd == rs1 and rd == rs2:
            RegAllArray.append(rd)
        else:
            pass
        return RegAllArray
class assembler:
    def swap(self, strA):
        if strA == "1" :
            strA = "0"
        else:
            strA = "1"
        return strA
    def shift_bit_left_logical(value_need_shift,value_shift):
        value = value_need_shift
        while(value_shift > 0):
            value       = value[1:32] + '0' 
            value_shift = value_shift - 1
        return value
    
    ############################### R cut ####################################
    ################## list = ['add','x12','x0','x35']
    def R_type(self, arr):
        aq = '1'
        rl = '1'
        string_out = ''
        number_arr= len(arr)
        if number_arr < 3:
                return 
        else:
            if dic_opcode[arr[0]] == '0110011':
                string_out  = string_out + dic_func7[arr[0]]
                string_out  = string_out + dic_reg[arr[3]]
                string_out  = string_out + dic_reg[arr[2]]
                string_out  = string_out + dic_func3[arr[0]]                       
                string_out  = string_out + dic_reg[arr[1]]
                string_out  = string_out + dic_opcode[arr[0]]
                return string_out
            else:
                string_out = string_out + dic_func5[arr[0]]
                string_out = string_out + aq
                string_out = string_out + rl
                string_out = string_out + '00000'
                string_out = string_out + dic_reg[arr[2]]
                string_out = string_out + dic_func3[arr[0]]
                string_out = string_out + dic_reg[arr[1]]
                string_out = string_out + dic_opcode[arr[0]]
                return string_out
       
    ############################# I cut ##############################3
    ############# 4   = [ 'lw','x14','12','x1' ] trường hợp lw lh lb lbu lhu
    ############ 4   = [ 'addi','x14','x1','12' ] các trường hợp còn lại của I
    ############### srli x2 x2 16
    ############### Csrrw x2,x5,sstatus
    
    def I_type(self, arr):
        string_out = ''
        number_arr = len(arr)

        if number_arr == 1 :# ECALL 
            if dic_func7[arr[0]] == '000000000000':
                string_out = string_out + '000000000000'
                string_out = string_out + '00000'
                string_out = string_out + '000'
                string_out = string_out + '00000'
                string_out = string_out + '1110011'
            else:
                string_out = string_out + '000000000001'
                string_out = string_out + '00000'
                string_out = string_out + '000'
                string_out = string_out + '00000'
                string_out = string_out + '1110011'
            return string_out
        else:
            if dic_opcode[arr[0]] == '0000011': # lw lh lb lbu lhu
                imm_new = int(arr[2])
                if imm_new < 0 :
                    return 
                else:
                    imm_new     = format(imm_new,"0""12""b")
                    string_out  = string_out + imm_new
                    string_out  = string_out + dic_reg[arr[3]]
                    string_out  = string_out + dic_func3[arr[0]]
                    string_out  = string_out + dic_reg[arr[1]]
                    string_out  = string_out + dic_opcode[arr[0]]
                    return string_out
            elif dic_opcode[arr[0]] == '1110011': # csr
                if dic_func3[arr[0]] == '001' or dic_func3[arr[0]] == '010' or dic_func3[arr[0]] == '011':
                    string_out = string_out + dic_reg[arr[3]]
                    string_out = string_out + dic_register_csr[arr[2]]
                    string_out = string_out + dic_func3[arr[0]]
                    string_out = string_out + dic_reg[arr[1]]
                    string_out = string_out + dic_opcode[arr[0]]
                else:
                    imm_shamt = int(arr[3])
                    imm_shamt = format(imm_shamt,"0""5""b")
                    string_out = string_out + dic_register_csr[arr[3]]
                    string_out = string_out + imm_shamt
                    string_out = string_out + dic_func3[arr[0]]
                    string_out = string_out + dic_reg[arr[1]]
                    string_out = string_out + dic_opcode[arr[0]]
                return string_out
            elif dic_opcode[arr[0]] == '1100111': # jalr
                imm_new = int(arr[2])
                imm_new     = format(imm_new,"0""12""b")
                string_out = string_out + imm_new
                string_out = string_out + dic_reg[arr[3]]
                string_out = string_out + '000'
                string_out = string_out + dic_reg[arr[1]]
                string_out  = string_out + dic_opcode[arr[0]]
                return string_out
            else:
                if dic_func3[arr[0]] == '101':
                    imm_shamt = int(arr[3])
                    imm_shamt = format(imm_shamt,"0""5""b")
                    if dic_func7[arr[0]] == '0100000':
                        string_out = string_out + '0100000'
                        string_out = string_out + imm_shamt
                        string_out = string_out + dic_reg[arr[2]]
                        string_out = string_out + dic_func3[arr[0]]
                        string_out = string_out + dic_reg[arr[1]]
                        string_out = string_out + dic_opcode[arr[0]]
                    else:
                        string_out = string_out + '0000000'
                        string_out = string_out + imm_shamt
                        string_out = string_out + dic_reg[arr[2]]
                        string_out = string_out + dic_func3[arr[0]]
                        string_out = string_out + dic_reg[arr[1]]
                        string_out = string_out + dic_opcode[arr[0]]
                elif dic_func3[arr[0]] == '001':
                    imm_shamt = int(arr[3])
                    imm_shamt = format(imm_shamt,"0""5""b")
                    string_out = string_out + dic_func7[arr[0]]
                    string_out = string_out + imm_shamt
                    string_out = string_out + dic_reg[arr[2]]
                    string_out = string_out + dic_func3[arr[0]]
                    string_out = string_out + dic_reg[arr[1]]
                    string_out = string_out + dic_opcode[arr[0]]       
                else:
                    a = arr[3]
                    if a.startswith("-"):
                        imm_new = int(a)
                        imm_new = format(imm_new,"0""13""b")
                        imm_new = imm_new.replace("-", "0")
                        a_new   = imm_new.find("1")
                        b       = imm_new.rfind("1")
                        imm_replace = imm_new.replace('0','1')[0:a_new]
                        imm_swap    = imm_new[a_new:b]
                        imm_swap_past = ''
                        for i in range(len(imm_swap)):
                            imm_swap_past = imm_swap_past + self.swap(imm_swap[i])
                        imm_new = imm_replace + imm_swap_past + imm_new[b:]
                        imm_new = imm_new[1:]
                    else:
                        imm_new = int(a)
                        imm_new = format(imm_new,"0""12""b")
                    string_out = string_out + imm_new
                    string_out = string_out + dic_reg[arr[2]]
                    string_out = string_out + dic_func3[arr[0]]
                    string_out = string_out + dic_reg[arr[1]]
                    string_out = string_out + dic_opcode[arr[0]]
                return string_out
    ##############################  S type ##############################
                ############# sw x1 8 x14
    def S_type(self, arr):
        string_out = ''
        number_arr = len(arr)
        if number_arr < 4 :
            return 0
        else:
            imm_new = int(arr[2])
            if imm_new < 0:  ## giá trị  thanh ghi thì ko có dụ âm
                pass
            else:
                imm_new = format(imm_new,"0""12""b")
                string_out = string_out + imm_new[0:7]
                string_out = string_out + dic_reg[arr[1]]
                string_out = string_out + dic_reg[arr[3]]
                string_out = string_out + dic_func3[arr[0]]
                string_out = string_out + imm_new[7:12]
                string_out = string_out + dic_opcode[arr[0]]
                return string_out   
    ################################ SB type ################################
                ############# beq x13 x12 "label"##################
    def SB_type(self, arr, dic_label):
        string_out = ''
        number_arr = len(arr)
        if number_arr < 4 :
            return 0 
        else:
            key = arr[3]
            if key in dic_label:
                offset = int(dic_label[arr[3]])
                #offset = int(dic_label[key] - current_address)   # Tính offset
            else:
                offset = int(arr[3])
               # offset = int(dic_label[key]) # Nếu không có nhãn, lấy giá trị trực tiếp

            # Xử lý bù 2 nếu offset âm
            if offset < 0:
                offset = int((1 << 13) + offset)

            # Chuyển offset sang nhị phân 13 bit
            imm_change = format(offset, "013b")

            # Tách các trường theo định dạng SB-type
            string_out += imm_change[0]         # Bit 12
            string_out += imm_change[2:8]       # Bits 10-5
            string_out += dic_reg[arr[2]]       # rs2
            string_out += dic_reg[arr[1]]       # rs1
            string_out += dic_func3[arr[0]]     # func3
            string_out += imm_change[8:12]      # Bits 4-1
            string_out += imm_change[1]         # Bit 11
            string_out += dic_opcode[arr[0]]    # opcode
            #return f"{offset} và {imm_change} và {current_address}"
            return string_out
    ################################ U type ################################
                ############# LUI x12 0x123123  ##################
                ############# AUIPC x12 0  ##################
    def U_type(self, arr):
        string_out = ''
        number_arr = len(arr)
        if number_arr < 3 :
            return 0
        else:
            imm = arr[2]
            imm = bin(int(imm))
            imm = imm[2:]
            imm = imm.rjust(20,"0")
            string_out = string_out + imm
            string_out = string_out + dic_reg[arr[1]]
            string_out = string_out + dic_opcode[arr[0]]
            return string_out
    ################################ UJ type ################################
                ############# JAL x12 'label'  ##################
    def UJ_type(self, arr, dic_label):
        string_out = ''
        imm_new = ''
        number_arr = len(arr)
        if number_arr < 3:
            return 
        else:
            key = arr[2]
            if key in dic_label:
                offset = int(dic_label[arr[2]])
                #offset = int(dic_label[key] - current_address) // 2  # Tính offset
            else:
                offset = int(arr[2])
                #offset = int(arr[2]) //2
            if offset < 0:
                offset = int((1 << 20) + offset)  # Xử lý offset âm bằng cách lấy bù 2
            imm = format(offset, "020b")
            # Mã hóa lại các bit theo định dạng UJ
            imm_new += imm[0]      # Bit 20 (bit dấu)
            imm_new += imm[10:20]     # Bit 10-19
            imm_new += imm[9]
            imm_new += imm[1:9]       # Bit 1-8
            # Kết hợp lại thành chuỗi nhị phân
            string_out += imm_new
            string_out += dic_reg[arr[1]]
            string_out += dic_opcode[arr[0]]
            return string_out
class QuantumSimulator:
    def __init__(self) -> None:
        self.state = None
        self.num_qubits = 0
        self.rotation_info = []

    def reset(self, num_qubits):
        self.num_qubits = num_qubits
        self.state = np.zeros((2 ** num_qubits,), dtype=complex)
        self.state[0] = 1
        self.rotation_info = []

    def apply_gate(self, gate, target_qubits):
        full_gate = np.eye(1)
        for qubit in range(self.num_qubits):
            if qubit in target_qubits:
                full_gate = np.kron(full_gate, gate)
            else:
                full_gate = np.kron(full_gate, np.eye(2))
        self.state = np.dot(full_gate, self.state)

    def write(self, value, target_qubits):
        for i in range(self.num_qubits):
            if (target_qubits == []) or (i in target_qubits):
                if value & (1 << i):
                    self.apply_gate(np.array([[0, 1], [1, 0]]), [i])

    def not_gate(self, target_qubits):
        self.apply_gate(np.array([[0, 1], [1, 0]]), target_qubits)

    def cnot_gate(self, target_qubits, condition_qubits):
        for tq in target_qubits:
            for cq in condition_qubits:
                self._apply_cnot(tq, cq)

    def _apply_cnot(self, target, control):
        new_state = self.state.copy()
        for i in range(len(self.state)):
            if (i >> target) & 1:
                if (i >> control) & 1:
                    new_state[i ^ (1 << target)] = self.state[i]
                    new_state[i] = self.state[i ^ (1 << target)]
        self.state = new_state

    def hadamard(self, target_qubits):
        h_gate = (1 / np.sqrt(2)) * np.array([[1, 1], [1, -1]])
        self.apply_gate(h_gate, target_qubits)

    def chadamard(self, target_qubits, condition_qubits):
        for tq in target_qubits:
            for cq in condition_qubits:
                self._apply_cnot(tq, cq)
                self.hadamard([tq])
                self._apply_cnot(tq, cq)

    def phase(self, theta_degrees, target_qubits):
        theta_radians = np.deg2rad(theta_degrees)
        phase_gate = np.array([[1, 0], [0, np.exp(1j * theta_radians)]])
        self.apply_gate(phase_gate, target_qubits)
        # Lưu thông tin xoay pha
        self.rotation_info.append(f"phase: {theta_degrees} degrees on qubits {target_qubits}")

    def Swap(self, qubit1, qubit2, condition_qubits):
        for cq in condition_qubits:
            self._apply_swap(qubit1, qubit2, cq)

    def _apply_swap(self, qubit1, qubit2, control):
        new_state = self.state.copy()
        for i in range(len(self.state)):
            if (i >> control) & 1:
                if ((i >> qubit1) & 1) != ((i >> qubit2) & 1):
                    new_i = i ^ (1 << qubit1) ^ (1 << qubit2)
                    new_state[new_i] = self.state[i]
        self.state = new_state

    def rotatex(self, theta_degrees, target_qubits):
        theta_radians = np.deg2rad(theta_degrees)
        rx_gate = np.array([[np.cos(theta_radians / 2), -1j * np.sin(theta_radians / 2)],
                            [-1j * np.sin(theta_radians / 2), np.cos(theta_radians / 2)]])
        self.apply_gate(rx_gate, target_qubits)
        # Lưu thông tin xoay pha
        self.rotation_info.append(f"rotatex: {theta_degrees} degrees on qubits {target_qubits}")

    def rotatey(self, theta_degrees, target_qubits):
        theta_radians = np.deg2rad(theta_degrees)
        ry_gate = np.array([[np.cos(theta_radians / 2), -np.sin(theta_radians / 2)],
                            [np.sin(theta_radians / 2), np.cos(theta_radians / 2)]])
        self.apply_gate(ry_gate, target_qubits)
        # Lưu thông tin xoay pha
        self.rotation_info.append(f"rotatey: {theta_degrees} degrees on qubits {target_qubits}")

    def measure(self):
        probabilities = np.abs(self.state) ** 2
        measurement_results = {bin(i)[2:].zfill(self.num_qubits)[::-1]: round(probabilities[i] * 100, 2) for i in range(len(probabilities))}
        sorted_results = dict(sorted(measurement_results.items()))
        formatted_results = [f"State: {state}, Probability: {prob}%" for state, prob in sorted_results.items()]
        #formatted_results = [f"{state}: {prob}%" for state, prob in sorted_results.items()]
         # Kết hợp thông tin về góc xoay
        if self.rotation_info:
            formatted_results.append("\nRotation Info:")
            formatted_results.extend(self.rotation_info)
        return formatted_results


qs = QuantumSimulator()
rv = assembler()
iss = ISS()

@app.route('/run_code_quantum', methods=['POST'])
def run_code_quantum():
    data = request.get_json()
    code = data['code']
    mode = data['mode']
    output = []
    test_cases = code.split('\n')
    for line in test_cases:
        parts = line.strip().split()
        if not parts:
            continue
        command = parts[0]
        try:
            if command == 'reset':
                qs.reset(int(parts[1]))
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'write':
                qs.write(int(parts[1]), [])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'not':
                qs.not_gate([int(parts[1])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'cnot':
                qs.cnot_gate([int(parts[1])], [int(parts[2])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'hadamard':
                qs.hadamard([int(parts[1])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'chadamard':
                qs.chadamard([int(parts[1])], [int(parts[2])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'phase':
                qs.phase(float(parts[1]), [int(parts[2])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'swap':
                qs.Swap(int(parts[1]), int(parts[2]), [])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'rotatex':
                qs.rotatex(float(parts[1]), [int(parts[2])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'rotatey':
                qs.rotatey(float(parts[1]), [int(parts[2])])
                if mode == 2:
                    result = qs.measure()
                    output.extend(result)
            elif command == 'measure':
                result = qs.measure()
                output.extend(result)
            else:
                unclean_command = command.strip()
                if unclean_command:
                    output.append(unclean_command)
                else:
                    output.append("Unknown command")
        except Exception as e:
            output.append(f"Error executing {command}: {str(e)}")
    filtered_output = [line for line in output if "State:" in line or "Probability:" in line]
    return jsonify({'output': '\n'.join(filtered_output)})
    #return jsonify({'output': ', '.join(output)})

@app.route('/process_assembly', methods=['POST'])
def process_assembly():
    data = request.get_json()
    code = data.get('code', '')

    if not code:
        return jsonify({"error": "No assembly code provided"}), 400

    try:
        # Chuẩn bị dữ liệu từ mã đầu vào
        code_lines = code.split('\n')
        dic_label = {}  # Từ điển lưu địa chỉ của các nhãn
        label_address = 0
        fileA_lines = []
        fileB_lines = []

        # Ghi nhãn và tạo fileA
        for line in code_lines:
            # Xóa chú thích phía sau dấu '#'
            if '#' in line:
                line = line.split('#', 1)[0]
            line = line.strip()  # Xóa khoảng trắng thừa

            if not line:  # Bỏ qua dòng trống sau khi xóa chú thích
                continue

            if line.endswith(':'):  # Nếu là nhãn
                label = line[:-1]
                dic_label[label] = str(label_address)  # Ghi lại địa chỉ nhãn
                fileA_lines.append(line)
                fileA_lines.append('')  # Thêm 2 dòng trống
                fileA_lines.append('')
                fileA_lines.append('')
                fileA_lines.append('')
            elif line.startswith(("reset", "write", "not", "cnot", "hadamard", "chadamard", "swap", "phase", "rotatex", "rotatey", "measure")):  # Nếu dòng bắt đầu bằng 'reset' hoặc 'hadamard'
                fileA_lines.append("addi x0, x0, 0")
                fileA_lines.append('')  # Thêm 2 dòng trống
                fileA_lines.append('')
                fileA_lines.append('')
            else:  # Nếu là lệnh thông thường
                fileA_lines.append(line)
                fileA_lines.append('')  # Thêm 2 dòng trống
                fileA_lines.append('')
                fileA_lines.append('')

            label_address += 4
            
        # Lưu fileA
        fileA_path = os.path.join(os.getcwd(), 'fileA.txt')
        with open(fileA_path, 'w') as f:
            f.write('\n'.join(fileA_lines))

                # Tạo fileB: Xóa nhãn và dấu ':'
        for line in fileA_lines:
            if line.strip().endswith(':'): 
                continue  # Bỏ qua dòng chỉ chứa nhãn
            elif ':' in line:  # Nếu dòng chứa dấu ':'
                parts = line.split(':', 1)
                fileB_lines.append(parts[1].strip())
            else:
                fileB_lines.append(line.strip())  # Giữ nguyên dòng không chứa nhãn
        # Thêm dòng trống như fileA
        fileB_lines_with_spacing = []
        for line in fileB_lines:
            if line or "\n":
                fileB_lines_with_spacing.append(line)

        # Lưu fileB
        fileB_path = os.path.join(os.getcwd(), 'fileB.txt')
        with open(fileB_path, 'w') as f:
            f.write('\n'.join(fileB_lines_with_spacing))


        # Mã hóa fileB thành nhị phân và lưu fileC
        output = []
        current_address = 0
        for line in fileB_lines:
            line = line.strip()
            if '#' in line:
                line = line.split('#', 1)[0]
            line = line.strip()

            if not line:  # Bỏ qua dòng trống sau khi xử lý
                output.append('')
                continue

            parts = line.replace(",", " ").split()
            opcode = parts[0]

            if opcode not in dic_format:
                output.append(f"Error: Unknown instruction {opcode}")
                continue

            case_type = dic_format[opcode]
            try:
                if case_type == 'R-type':
                    result = rv.R_type(parts)
                elif case_type == 'I-type':
                    if '(' in parts[2] and ')' in parts[2]:
                        offset, register = parts[2].split('(')
                        register = register.strip(')')
                        parts[2] = offset
                        parts.insert(3, register)
                    result = rv.I_type(parts)
                elif case_type == 'S-type':
                    if '(' in parts[2] and ')' in parts[2]:
                        offset, register = parts[2].split('(')
                        register = register.strip(')')
                        parts[2] = offset
                        parts.insert(3, register)
                    result = rv.S_type(parts)
                elif case_type == 'SB-type':
                    result = rv.SB_type(parts, dic_label)
                elif case_type == 'U-type':
                    result = rv.U_type(parts)
                elif case_type == 'UJ-type':
                    result = rv.UJ_type(parts, dic_label)
                else:
                    result = f"Error: Unsupported format {case_type}"

                output.append(result if result else f"Error processing {line}")
                # output.extend([''] * 4)  # Thêm khoảng trắng giữa các lệnh

                #current_address += 4  # Cập nhật địa chỉ
            except Exception as e:
                output.append(f"Error: {str(e)} while processing {line}")
                # output.extend([''] * 4)
        # Lưu fileC
        fileC_path = os.path.join(os.getcwd(), 'fileC.txt')
        with open(fileC_path, 'w') as f:
            f.write('\n'.join(output))
        return jsonify({
            "output": output,
            "fileA": "fileA.txt",
            "fileB": "fileB.txt",
            "fileC": "fileC.txt",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process_iss', methods=['POST'])
def process_iss():
    try:
        # Reset các biến toàn cục trước khi chạy
        global reg_list, pc_array, mem_list,  current_state, state
        reg_list = ["0" * 32] * 32
        pc_array = [0] * 3000
        mem_list = ["0" * 32] * 262143
        
        # Đường dẫn fileC.txt
        fileC_path = os.path.join(os.getcwd(), 'fileC.txt')
        if not os.path.exists(fileC_path):
            return jsonify({"error": "fileC.txt not found"}), 404
        sum_line = 0
        current_line = 0
        start_line = 0
        branch_jump_loop = 0
        branch_loop = False
        branch_forward = 0
        branch_back = 0
        jump_over = 0
        jump_back = 0

        # Đọc và tính tổng số dòng
        with open(fileC_path, "r") as file_read:
            for _ in file_read:
                sum_line += 1

        with open(fileC_path, "r") as file_read:
            while current_line < sum_line:
                line = file_read.readline().strip()

                if current_line < start_line:
                    current_line += 1
                    continue

                if not line or len(line) == 1:
                    current_line += 1
                    continue

                if not branch_loop:
                    line = line.lstrip().rstrip()
                    must_jump, data_out, j, b = iss.check_opcode(line, current_line, pc_array)

                    pc_array[current_line] += 1
                    if must_jump:
                        if current_line < data_out:
                            if j:
                                jump_over += 1
                            elif b:
                                branch_forward += 1
                        elif current_line > data_out:
                            if j:
                                jump_back += 1
                            elif b:
                                branch_back += 1
                        current_line = 0
                        start_line = data_out
                        file_read.seek(0, 0)
                        continue

                    if pc_array[current_line] >= 100:
                        branch_jump_loop += 1
                        branch_loop = True
                        print("Loop detected")
                current_line += 1

            # Tạo dữ liệu xuất ra trực tiếp dưới dạng string
            reg_output = "  number_register\t\t\t\t\t\t  value of register\n"
            for i, value in enumerate(reg_list):
                reg_output += f"\t{i}\t\t\t\t\t\t{value}\n"
                reg_output += "--------------------------------------------------------------------------------------------\n"

            mem_output = ""
            if all(value == "00000000000000000000000000000000" for value in mem_list):
                mem_output = "No data memory is being used\n"
            else:
                mem_output = "  Memory Address\t\t\t\t\t\t     Value\n"
                for i, value in enumerate(mem_list):
                    if value != "00000000000000000000000000000000":
                        mem_output += f"\t{i}\t\t\t\t\t\t{value}\n"
                        mem_output += "--------------------------------------------------------------------------------------------\n"
            print("Mode True - Running in detailed mode")
            # Trả về phản hồi từng bước
            return jsonify({
                "status": "Processing run",
                "registers": reg_output,
                "memory": mem_output
            }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/step_iss', methods=['POST'])
def step_iss():
    try:
        # Reset các biến toàn cục trước khi chạy
        global reg_list, pc_array, mem_list, store
        reg_list = ["0" * 32]*32
        pc_array = [0] * 3000
        mem_list = ["0" * 32] * 262143
        store = []
        # # Lấy tham số mode từ request JSON
        # Đường dẫn fileC.txt
        fileC_path = os.path.join(os.getcwd(), 'fileC.txt')
        if not os.path.exists(fileC_path):
            return jsonify({"error": "fileC.txt not found"}), 404
        sum_line = 0
        current_line = 0
        start_line = 0
        branch_jump_loop = 0
        branch_loop = False
        branch_forward = 0
        branch_back = 0
        jump_over = 0
        jump_back = 0

        # Đọc và tính tổng số dòng
        with open(fileC_path, "r") as file_read:
            for _ in file_read:
                sum_line += 1
        reg_output = ""
        with open(fileC_path, "r") as file_read:
            batch_counter = 1
            while current_line < sum_line:
                line = file_read.readline().strip()

                if current_line < start_line:
                    current_line += 1
                    continue

                if not line or len(line) == 1:
                    current_line += 1
                    continue

                if not branch_loop:
                    line = line.lstrip().rstrip()
                    must_jump, data_out, j, b = iss.check_opcode(line, current_line, pc_array)
                    # Lưu thông tin cập nhật thanh ghi vào mảng store
                        
                    pc_array[current_line] += 1
                    if must_jump:
                        if current_line < data_out:
                            if j:
                                jump_over += 1
                            elif b:
                                branch_forward += 1
                        elif current_line > data_out:
                            if j:
                                jump_back += 1
                            elif b:
                                branch_back += 1
                        current_line = 0
                        start_line = data_out
                        file_read.seek(0, 0)
                        continue

                    if pc_array[current_line] >= 100:
                        branch_jump_loop += 1
                        branch_loop = True
                        print("Loop detected")
                        # Cập nhật thanh ghi và ghi vào file
                # for i, value in enumerate(reg_list):
                #     if value != "00000000000000000000000000000000":
                #         store.append(f"\u0110\u00e3 c\u1eadp nh\u1eadt thanh ghi x{i}: {value}")
                # Tạo dữ liệu xuất ra trực tiếp dưới dạng string
                reg_output += "  number_register\t\t\t\t\t\t  value of register\n"
                current_line += 1
                for i, value in enumerate(reg_list):
                        
                        reg_output += f"\t{i}\t\t\t\t\t\t{value}\n"
                        reg_output += "--------------------------------------------------------------------------------------------\n"
                        # Khi i là 31, in thêm dòng thông báo
                        if (i + 1) % 32 == 0:
                            reg_output += f"done 31 - {batch_counter}\n"
                            batch_counter += 1
           # In kết quả của store
        print("Mode True - Running in detailed mode")
        # Trả về phản hồi từng bước
        return jsonify({
            "status": "Processing run",
            "store": reg_output
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)


#=----------------------------------------------------------------------------------------------------------------------------------------------#
