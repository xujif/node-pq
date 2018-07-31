import { EventEmitter } from 'events';

export interface Opt {
    concurrency: number
    autoStart: boolean
}

interface QueueItem {
    readonly id: number
    readonly handle: () => Promise<any>
}

export class PromiseQueue {
    protected nextId = 0
    protected opt: Opt
    protected queue: QueueItem[] = []
    protected _activeWorkers = 0
    protected _isRunning = false
    protected evt = new EventEmitter()
    constructor(opt?: Partial<Opt>) {
        this.opt = Object.assign({ concurrency: 1, autoStart: true }, opt)
        if (this.opt.autoStart) {
            this.start()
        }
    }
    get isRunning () {
        return this._isRunning
    }

    /**
     * get total length, pending items + running items
     *
     * @readonly
     * @memberof PromiseQueue
     */
    get length () {
        return this.queue.length + this._activeWorkers
    }

    /**
     * get the length of pending items
     *
     * @readonly
     * @memberof PromiseQueue
     */
    get pendingLength () {
        return this.queue.length
    }

    waitingForDone () {
        return new Promise<void>((r) => {
            this.evt.once('done', r)
        })
    }

    on (event: 'pause' | 'start' | 'empty' | 'done', listener: () => any) {
        return this.evt.on(event, listener)
    }
    /**
     * clear the pending items
     *
     * @memberof PromiseQueue
     */
    clear () {
        this.queue.splice(0, this.queue.length)
    }
    /**
     * start the queue workers
     *
     * @memberof PromiseQueue
     */
    start () {
        this._isRunning = true
        const len = Math.min(this.queue.length, this.opt.concurrency)
        for (let i = 0; i < len; i++) {
            this._triggerWorker()
        }
        this.evt.emit('start')
    }

    pause () {
        this.evt.emit('pause')
        this._isRunning = false
    }

    push<T=any> (handle: (() => Promise<T>)) {
        const queueId = this.nextId++
        this.queue.push({
            id: queueId,
            handle: handle
        })
        if (this._isRunning && this._activeWorkers < this.opt.concurrency) {
            this._triggerWorker()
        }
        return new Promise<T>((r, j) => {
            this.evt.once(`resolve::${queueId}`, r)
            this.evt.once(`reject::${queueId}`, j)
        })
    }
    protected _triggerWorker () {
        if (this._activeWorkers > this.opt.concurrency) {
            return
        }
        this._activeWorkers++;
        setImmediate(this._run.bind(this))
    }
    protected async _run () {
        while (this._isRunning && this.queue.length) {
            const item = this.queue.shift()!
            if (this.queue.length === 0) {
                this.evt.emit('empty')
            }
            try {
                const v = await item.handle()
                this.evt.emit(`resolve::${item.id}`, v)
            } catch (e) {
                this.evt.emit(`reject::${item.id}`, e)
            }
        }
        this._activeWorkers--;
        if (this._isRunning && this._activeWorkers === 0) {
            this.evt.emit('done')
        }
    }
}
