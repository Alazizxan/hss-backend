import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesystemEngine {
    async pwd(session: any) {
        return session.currentDirectory;
    }

    async whoami(session: any) {
        return session.username;
    }

    async hostname(session: any) {
        return session.hostname;
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