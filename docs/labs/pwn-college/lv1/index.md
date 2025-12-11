# pwn.college lv1（白腰带）

白腰带挑战其实并不算挑战，就是熟悉一下 pwn.college 这个平台的基础操作。

平台支持多种连接方式，WebSSH、WebVSCode、WebVNC，还有直接SSH都行，随便选一个顺手的用就好了。

记得提前了解一下Linux的基础概念，特别是flag文件和权限管理。不熟悉的话建议先看看Linux Luminarium那边的教程。


## SENSAI - 靶机+AI联动

pwn.college 是真的想教会所有人 pwn，靶机还给联动大模型助手233

![pwncollegelv1-1](/img/pwncollegelv1-1.png)
![pwncollegelv1-2](/img/pwncollegelv1-2.png)


## Challenge Programs - 第一个提权

蛮好玩就是`Challenge Programs`关卡了，让你执行`/challenge/solve`。一开始我还以为就是个二进制，用`file`命令看看，发现是个shell脚本。但是执行的时候发现不对劲，它居然能读取`/flag`文件，这个文件普通用户是没权限访问的。

关键在于：

```bash
#!/usr/bin/exec-suid --real -- /bin/bash -p
```

这里用了`exec-suid`，让脚本以root权限执行，所以才能读取到普通用户访问不了的`/flag`文件。

这个脚本暗示着，在pwn题里，提权和 suid 利用会是家常便饭。很多时候需要想办法获得更高的权限才能拿到flag。

整个脚本就是这样的：

```shell
hacker@welcome~challenge-programs:/challenge$ cat solve
#!/usr/bin/exec-suid --real -- /bin/bash -p

# art from https://emojicombos.com/kick-ascii-art
cat <<END | while read LINE; do echo "$LINE"; sleep 0.1; done
⠀⢀⣶⣿⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠘⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⢀⣤⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠈⠙⠋⢁⣀⣠⣤⣀⣀⣀⣰⣿⠟⠁⠀⠀⠀⠀⠀⠀
⠀⠀⣀⣴⣾⣿⣿⣿⣿⣿⠿⠿⠿⠋⠀⠀⠀⠀⣀⣤⣶⡆
⢠⣾⣿⣿⢿⣿⣿⣿⣿⣧⠀⠀⠀⣀⣤⣴⣾⣿⡿⠟⠋⠀
⠘⣿⣇⠀⠈⢻⣿⣿⣿⣿⣷⣶⣿⣿⣿⡿⠛⠉⠀⠀⠀⠀
⠀⢻⣿⡆⠀⠀⣿⣿⣿⣿⣿⣿⠿⠋⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠈⠛⠁⠀⠀⢹⣿⣿⡟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠘⣿⣿⡇⠀WELCOME⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀TO⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀THE⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢿⣿⠁⠀DOJO⠀⠀⠀⠀⠀⠀⠀

END

for i in {1..10}
do
	echo -n "."
	sleep 0.1
done
echo
echo "Congratulations! Your flag is:"
cat /flag
```

