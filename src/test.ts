import { PromiseQueue } from '.';

const sleep = function (t: number) {
    return new Promise<void>((r, j) => {
        setTimeout(r, t)
    })
}
const p = new PromiseQueue({ concurrency: 100 })
p.on('done', () => console.log('done'))
p.on('empty', () => console.log('empty'))
for (let i = 0; i < 20; i++) {
    p.push(async () => {
        console.log(i)
        if (i === 10) {
            p.pause()
            setTimeout(() => p.start(), 10000)
        }
        await sleep(Math.random() * 3000)
        return i * 2
    })
}