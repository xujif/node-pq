
### A promise queue, with concurrency limiting, written by typescript
## install
```
npm install node-pq
// or
yarn add node-pq
```
## Usage
```typescript
import { PromiseQueue } from 'node-pq'
const p = new PromiseQueue({ concurrency: 3 })

p.on('done', () => console.log('done'))
p.on('empty', () => console.log('empty'))

for (let i = 0; i < 20; i++) {
    p.push(async () => {
        if (i === 10) {
            p.pause()
            setTimeout(() => p.start(), 10000)
        }
        await sleep(Math.random() * 3000)
        return i * 2
    }).then(v=>{
        // then
    }).catch(e=>{
        // on rejest
    })
}
```
## Interface:
```typescript
class PromiseQueue {
    readonly isRunning: boolean;
    /**
     * get total length, pending items + running items
     *
     * @readonly
     * @memberof PromiseQueue
     */
    readonly length: number;
    /**
     * get the length of pending items
     *
     * @readonly
     * @memberof PromiseQueue
     */
    readonly pendingLength: number;


    waitingForDone(): Promise<void>;


    on(event: 'pause' | 'start' | 'empty' | 'done', listener: () => any): EventEmitter;
    /**
     * clear the pending items
     *
     * @memberof PromiseQueue
     */
    clear(): void;
    /**
     * start the queue workers
     *
     * @memberof PromiseQueue
     */
    start(): void;
    pause(): void;
    push<T = any>(handle: (() => Promise<T>)): Promise<T>;
}
export default PromiseQueue;

```