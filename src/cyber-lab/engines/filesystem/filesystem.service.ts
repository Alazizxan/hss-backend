import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';


type CdResult =
    | {
        success: true;
        nextPath: string;
    }
    | {
        success: false;
        output: string;
    };

@Injectable()
export class FilesystemService {

    constructor(
        private prisma: PrismaService,
    ) { }

    async ls(session: any) {
        const files =
            await this.prisma.cyberLabSessionFile.findMany({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                },
                orderBy: [
                    {
                        type: 'desc',
                    },
                    {
                        name: 'asc',
                    },
                ],
            });

        return files
            .map((f) => f.name)
            .join('    ');
    }
    async pwd(session: any) {
        return session.currentDirectory;
    }

    async whoami(session: any) {
        return session.username;
    }

    async hostname(session: any) {
        return session.hostname;
    }

    async cd(
        session: any,
        target: string,
    ): Promise<CdResult> {
        let nextPath = '';

        if (!target || target === '~') {
            nextPath = `/home/${session.username}`;
        }
        else if (target.startsWith('/')) {
            nextPath = target;
        }
        else if (target === '..') {
            const parts =
                session.currentDirectory
                    .split('/')
                    .filter(Boolean);

            parts.pop();

            nextPath =
                '/' + parts.join('/');

            if (!nextPath) {
                nextPath = '/';
            }
        }
        else {
            nextPath =
                `${session.currentDirectory}/${target}`
                    .replace('//', '/');
        }

        const dir =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path:
                        nextPath === '/'
                            ? '/'
                            : nextPath
                                .split('/')
                                .slice(0, -1)
                                .join('/') || '/',
                    name:
                        nextPath === '/'
                            ? ''
                            : nextPath
                                .split('/')
                                .pop(),
                    type: 'DIRECTORY',
                },
            });

        if (!dir && nextPath !== '/') {
            return {
                success: false,
                output: `bash: cd: ${target}: No such file or directory`,
            };
        }

        return {
            success: true,
            nextPath,
        };
    }

    async cat(
        session: any,
        fileName: string,
    ) {
        const file =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: fileName,
                    type: 'FILE',
                },
            });

        if (!file) {
            return {
                success: false,
                output: `cat: ${fileName}: No such file or directory`,
            };
        }

        return {
            success: true,
            output: file.content || '',
        };
    }

    async grep(
        session: any,
        pattern: string,
        fileName: string,
    ) {
        const file =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: fileName,
                    type: 'FILE',
                },
            });

        if (!file) {
            return {
                success: false,
                output: `grep: ${fileName}: No such file or directory`,
            };
        }

        return {
            success: true,
            output:
                file.content
                    ?.split('\n')
                    .filter((line) =>
                        line.includes(pattern),
                    )
                    .join('\n') || '',
        };
    }


    async head(
        session: any,
        fileName: string,
    ) {
        const file =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: fileName,
                    type: 'FILE',
                },
            });

        if (!file) {
            return {
                success: false,
                output: `head: cannot open '${fileName}'`,
            };
        }

        return {
            success: true,
            output:
                file.content
                    ?.split('\n')
                    .slice(0, 10)
                    .join('\n') || '',
        };
    }

    async tail(
        session: any,
        fileName: string,
    ) {
        const file =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: fileName,
                    type: 'FILE',
                },
            });

        if (!file) {
            return {
                success: false,
                output: `tail: cannot open '${fileName}'`,
            };
        }

        return {
            success: true,
            output:
                file.content
                    ?.split('\n')
                    .slice(-10)
                    .join('\n') || '',
        };
    }


    async find(
        session: any,
        searchName: string,
    ) {
        const results =
            await this.prisma.cyberLabSessionFile.findMany({
                where: {
                    sessionId: session.id,
                    name: searchName,
                },
            });

        return results
            .map(
                (f) =>
                    `${f.path}/${f.name}`.replace(
                        '//',
                        '/',
                    ),
            )
            .join('\n');
    }

    async lsLong(
        session: any,
    ) {
        const files =
            await this.prisma.cyberLabSessionFile.findMany({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                },
            });

        return files
            .map(
                (f) =>
                    `${f.type === 'DIRECTORY'
                        ? 'drwxr-xr-x'
                        : '-rw-r--r--'
                    } ${f.owner} ${f.group} ${f.name}`,
            )
            .join('\n');
    }


    async mkdir(
        session: any,
        dirName: string,
    ) {
        const exists =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: dirName,
                },
            });

        if (exists) {
            return `mkdir: cannot create directory '${dirName}': File exists`;
        }

        await this.prisma.cyberLabSessionFile.create({
            data: {
                sessionId: session.id,
                path: session.currentDirectory,
                name: dirName,
                type: 'DIRECTORY',
                owner: session.username,
                group: session.username,
            },
        });

        return '';
    }



    async touch(
        session: any,
        fileName: string,
    ) {
        const exists =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: fileName,
                },
            });

        if (exists) {
            return '';
        }

        await this.prisma.cyberLabSessionFile.create({
            data: {
                sessionId: session.id,
                path: session.currentDirectory,
                name: fileName,
                type: 'FILE',
                content: '',
                owner: session.username,
                group: session.username,
            },
        });

        return '';
    }


    async rm(
        session: any,
        fileName: string,
    ) {
        const file =
            await this.prisma.cyberLabSessionFile.findFirst({
                where: {
                    sessionId: session.id,
                    path: session.currentDirectory,
                    name: fileName,
                },
            });

        if (!file) {
            return `rm: cannot remove '${fileName}': No such file`;
        }

        await this.prisma.cyberLabSessionFile.delete({
            where: {
                id: file.id,
            },
        });

        return '';
    }


    id(session: any) {
        return `uid=1000(${session.username}) gid=1000(${session.username}) groups=1000(${session.username}),27(sudo)`;
    }

    uname() {
        return `Linux web-03 6.8.0-31-generic #31-Ubuntu SMP x86_64 GNU/Linux`;
    }


    ipAddr() {
        return `
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
    inet 127.0.0.1/8 scope host lo

2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 10.10.15.23/24 brd 10.10.15.255 scope global eth0
`;
    }



    ipRoute() {
        return `
default via 10.10.15.1 dev eth0
10.10.15.0/24 dev eth0 proto kernel scope link src 10.10.15.23
`;
    }


    psAux() {
        return `
root         1  0.0  systemd
root       523  0.0  sshd
root       781  0.0  nginx
mysql      902  0.1  mysqld
www-data  1123  0.0  php-fpm
analyst   2104  0.0  bash
`;
    }

    buildPrompt(session: any) {
        const shortPath =
            session.currentDirectory.replace(
                `/home/${session.username}`,
                '~',
            );

        return `${session.username}@${session.hostname}:${shortPath}$`;
    }
}