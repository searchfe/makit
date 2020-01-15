import * as treeify from 'treeify'

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
    private vertexToString: (v: T) => string

    constructor (vertexToString: (v: T) => string = x => x + '') {
        this.vertexToString = vertexToString
    }

    addVertex (v: T, vertexType = VertexType.None) {
        const type = this.vertices.get(v) || VertexType.None
        this.vertices.set(v, type | vertexType)
        if (!this.root) this.root = v
    }

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

    hasEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) return false
        return this.edges.get(fr)!.has(to)
    }

    /**
     * 是否存在环状结构
     *
     * 如果存在返回一个 circuit，否则返回 null
     */
    checkCircular (begin: T): T[] | null {
        let circularPath: T[] | null = null

        this.preOrder(begin, (node, path, visited) => {
            if (visited.has(node)) {
                circularPath = [...path, node].reverse()
            }
        })
        return circularPath
    }

    /**
     * 获取一条从 root 到 vertex 的路径
     */
    findPathToRoot (vertex: T): T[] {
        const seen: Set<T> = new Set()
        while (true) {
            if (seen.has(vertex)) return [...seen, vertex]
            else seen.add(vertex)

            const parents = this.redges.get(vertex)
            if (!parents || !parents.size) break

            vertex = parents.values().next().value
        }
        return [...seen]
    }

    getSinglePath (vertex: T): T[] {
        console.warn(
            '[makit] .getSinglePath() is deprecated, ' +
            'use .findPathToRoot() instead'
        )
        return this.findPathToRoot(vertex)
    }

    [inspect] () {
        return this.toString()
    }

    /**
     * 文本形式展示为树状结构
     */
    toString () {
        if (!this.root) return '[Empty Tree]'
        const root = this.vertexToString(this.root)
        const tree = treeify.asTree(this.toTree(), false, false)
        return `${root}\n${tree}`
    }

    /**
     * 转化为 Plain Object 表示的树，用于 treeify
     *
     * 注意：使用前需要先调用 checkCircular()，
     * 或从数据上确保它是一棵树。
     */
    private toTree () {
        const tree: Tree = {}
        const nodes = new Map([[this.root, tree]])

        this.preOrder(this.root, (vertex, stack, visited) => {
            const parentVertex = stack[stack.length - 1]
            const parentNode = nodes.get(parentVertex)
            if (!parentNode) return

            const childNode = parentNode[this.vertexToString(vertex)] = {}
            nodes.set(vertex, childNode)
            /**
             * 输出树时需要禁用 visited：
             *
             * 输出过的节点可能同时是其他节点的子节点，
             * 这个父子关系同样要写出来。
             */
            visited.clear()
        })
        return tree
    }

    private preOrder (vertex: T | undefined, visitor: Visitor<T>, path: T[] = [], visited: Set<T> = new Set()): void {
        if (!vertex) return
        else visitor(vertex, path, visited)

        if (visited.has(vertex)) return
        else visited.add(vertex)

        path.push(vertex)
        for (const child of this.edges.get(vertex) || []) {
            this.preOrder(child, visitor, path, visited)
        }
        path.pop()
    }
}
