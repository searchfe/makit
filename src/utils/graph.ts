import { asTree } from 'treeify'

const inspect = Symbol.for('nodejs.util.inspect.custom') || 'inspect'

type Visitor<T> = (vertex: T, stack: T[], visited: Set<T>) => (void | false)

type Tree = { [key: string]: Tree }

enum VertexType {
    None = 0,
    In = 1,
    Out = 2,
    InOut = 3
}

export class DirectedGraph<T> {
    private edges: Map<T, Set<T>> = new Map()
    private redges: Map<T, Set<T>> = new Map()
    private vertices: Map<T, VertexType> = new Map()
    private root?: T

    constructor (private readonly vertexToString: (v: T) => string = x => String(x) + '') {}

    /**
     * 增加一个点
     *
     * @param v 要增加的点
     * @param vertexType 点的类型（空、入、出、出入）
     */
    addVertex (v: T, vertexType = VertexType.None) {
        const type = this.vertices.get(v) || VertexType.None
        this.vertices.set(v, type | vertexType)
        if (!this.root) this.root = v
    }

    /**
     * 增加一条边
     *
     * @param fr 边的起点
     * @param to 边的终点
     */
    addEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) {
            this.edges.set(fr, new Set())
        }
        this.edges.get(fr)!.add(to)
        if (!this.redges.has(to)) {
            this.redges.set(to, new Set())
        }
        this.redges.get(to)!.add(fr)

        this.addVertex(fr, VertexType.Out)
        this.addVertex(to, VertexType.In)
    }

    /**
     * 检查是否包含边
     *
     * @param fr 起点
     * @param to 终点
     * @return 包含返回 true 否则 false
     */
    hasEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) return false
        return this.edges.get(fr)!.has(to)
    }

    * getOutVerticies (u: T) {
        for (let v of this.edges.get(u) || []) yield v
    }

    * getInVertices (u: T) {
        for (let v of this.redges.get(u) || []) yield v
    }

    getOutDegree (u: T) {
        return this.edges.has(u) ? this.edges.get(u)!.size : 0
    }

    /**
     * 是否存在环状结构
     *
     * @return 如果存在返回一个 circuit，否则返回 null
     */
    checkCircular (u: T, path: Set<T> = new Set(), visited: Set<T> = new Set()) {
        if (path.has(u)) {
            let patharr = [...path]
            patharr = [...patharr.slice(patharr.indexOf(u)), u]
            throw new Error(`Circular detected: ${patharr.join(' -> ')}`)
        }
        if (visited.has(u)) return
        else visited.add(u)

        path.add(u)
        for (const v of this.getOutVerticies(u)) {
            this.checkCircular(v, path, visited)
        }
        path.delete(u)
    }

    /**
     * 获取一条从 vertex 到 root 的路径
     *
     * @param vertex 路径的起点
     * @return 从 vertex 到 root 的路径
     */
    findPathToRoot (vertex: T): T[] {
        const seen: Set<T> = new Set()
        while (true) {
            // 出现循环引用时，数组收尾相同
            if (seen.has(vertex)) return [...seen, vertex]
            else seen.add(vertex)

            const parents = this.redges.get(vertex)
            if (!parents || !parents.size) break

            vertex = parents.values().next().value
        }
        return [...seen]
    }

    [inspect] () {
        return this.toString()
    }

    getInVerticesRecursively (target: T) {
        const dependants = new Set<T>()
        const queue = [target]
        for (const node of queue) {
            if (dependants.has(node)) continue
            dependants.add(node)
            for (const parent of this.redges.get(node) || []) {
                queue.push(parent)
            }
        }
        return dependants
    }

    /**
     * 以第一个点为根的树的文本表示
     *
     * @return 树的 ASCII 文本表示
     */
    toString () {
        if (!this.root) return '[Empty Tree]'
        const root = this.vertexToString(this.root)
        const tree = asTree(this.toTree(), false, false)
        return `${root}\n${tree}`
    }

    /**
     * 转化为 Plain Object 表示的树，用于 treeify
     *
     * 注意：使用前需要先调用 checkCircular()，
     * 或从数据上确保它是一棵树。
     *
     * @return 转为 Plain Object 的树状结构
     */
    private toTree (root = this.root) {
        const tree: Tree = {}
        if (!root) throw new Error('root not found')
        for (const child of this.getOutVerticies(root)) {
            tree[this.vertexToString(child)] = this.toTree(child)
        }
        return tree
    }

    * preOrder (vertex: T, visited: Set<T> = new Set()): IterableIterator<T> {
        if (visited.has(vertex)) return
        else visited.add(vertex)

        yield vertex

        for (const child of this.getOutVerticies(vertex)) {
            yield * this.preOrder(child, visited)
        }
    }
}
