# CTFshow PWN VIP 360

这是 CTFshow 平台的 PWN 付费大会员课程，共有 360 个靶场，系统化地覆盖了从基础到高级的二进制安全知识。

这里将记录 CTFshow PWN VIP 360 的学习笔记与 Writeup。

## 课程结构

| 靶场序号 | 模块 | 攻击面 | 攻击手段 |
|---------|------|--------|---------|
| 0-34 | 前置基础 | 计组原理<br>汇编基础<br>二进制文件基础<br>Linux相关基础命令<br>Linux安全机制 | ssh远程连接、配置pwn环境<br>读汇编指令,数据的传送与访问以及了解栈与函数的调用<br>从源码到可执行文件<br>基本命令的使用与绕过<br>保护机制的实现与利用 |
| 35-80 | 栈溢出与ROP | 栈溢出(Stack Overflow)<br>返回导向编程(ROP)<br>(Return-Oriented Programming) | ret2text<br>ret2shellcode<br>ret2syscall<br>ret2libc<br>ROP<br>BROP<br>SROP<br>ret2dl-resolve<br>Stack pivoting |
| 91-100 | 格式化字符串漏洞 | 格式化字符串漏洞（Format String Vulnerabilities） | 程序崩溃<br>栈数据泄露<br>任意地址内存泄露<br>栈数据覆盖<br>任意地址内存覆盖 |
| 101-110 | 整数安全 | 整数安全 | 整数溢出（Integer Overflow）<br>整数下溢（Integer Underflow）<br>整数截断（Integer Truncation）<br>整数比较（Integer Comparison）<br>整数转换（Integer Conversion）<br>标志位操作（Flag Manipulation）<br>随机数生成（Random Number Generation） |
| 111-134 | Bypass安全机制 | RELRO(Relocation Read-Only)<br>Stack Canaries (金丝雀保护)<br>No-execute (NX)<br>ASLR和PIE<br>FORTIFY_SOURCE | No RELRO 全关时的安全问题<br>Partial RELRO 部分开启时的安全问题<br>Full RELRO 全开时的安全问题<br>No Canary Found 时的安全问题<br>覆盖低字节泄露<br>格式化字符串泄露<br>SSP Leak<br>劫持 _stack_chk_fail 函数<br>one_by_one 爆破 canary<br>覆盖TLS中储存的canary值<br>C++异常机制绕过canary<br>栈地址任意写绕过canary检查<br>数组下标越界<br>No Nx 利用<br>Nx 绕过<br>地址空间布局随机化<br>位置无关可执行代码与文件<br>危险函数替换机制 |
| 135-305 | 堆利用 | 堆利用（Heap Exploitation）<br>House of 系列 | 堆溢出（Heap Overflow）<br>重复释放 (Double Free)<br>使用已释放的内存 (Use-After-Free, UAF)<br>未初始化的指针（Uninitialized Pointer）<br>堆块重叠（Heap Block Overlapping）<br>fastbin attack<br>tcache attack<br>Unsorted Bin into Stack<br>Large Bin Attack<br>house of spirit<br>house of einherjar<br>house of force<br>house of lore<br>house of orange<br>house of rabbit<br>house of roman<br>house of pig<br>house of banana<br>house of emma<br>house of kiwi<br>house of husk<br>house of corrosion<br>house of storm<br>house of atum<br>House of IO<br>House of apple1 2 3<br>house of gods... |
| 306-324 | PWN利用技巧 | PWN trick | one-gadget 和通用 gadget<br>Return-to-scu<br>DynELF泄露函数地址<br>SSP Leak<br>environ泄露栈地址<br>vsyscall的利用<br>劫持hook函数<br>_IO_FILE 结构利用 |
| 325-330 | 其他漏洞利用 | 逻辑漏洞利用 | 二级指针利用<br>未初始化验证<br>泄露特定信息<br>WEB-PWN |
| 331-355 | 异构PWN | Other architectures PWN | LLVM IR & LLVM Pass & VM<br>Windows PWN<br>MIPS PWN<br>ARM PWN<br>RISC-V PWN |
| 356-360 | 内核PWN | Kernel PWN 入门 | 缓冲区溢出<br>内核堆利用<br>内核ROP<br>内核模块利用<br>内核ROP链构建 |


