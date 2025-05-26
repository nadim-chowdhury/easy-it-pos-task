import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! I am Nadim Chowdhury, a Full Stack Developer from Bangladesh. Visit my portfolio at https://nadim.vercel.app';
  }
}
