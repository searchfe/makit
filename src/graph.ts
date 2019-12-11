import * as treeify from 'treeify'

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
    private root: T = null
    private vertexToString: (v: T) => string

    public constructor (vertexToString: (v: T) => string = x => x + '') {
        this.vertexToString = vertexToString
    }

    public addVertex (v: T, vertexType = VertexType.None) {
        const type = this.vertices.get(v) || VertexType.None
        this.vertices.set(v, type | vertexType)
        if (!this.root) this.root = v
    }

    public addEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) {
            this.edges.set(fr, new Set())
        }
        this.edges.get(fr).add(to)
        if (!this.redges.has(to)) {
            this.redges.set(to, new Set())
        }
        this.redges.get(to).add(fr)

        this.addVertex(fr, VertexType.Out)
        this.addVertex(to, VertexType.In)
    }

    public hasEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) return false
        return this.edges.get(fr).has(to)
    }

    public checkCircular (begin: T) {
        let circularPath

        this.preOrder(begin, (node, path, visited) => {
            if (visited.has(node)) {
                circularPath = [...path, node].reverse()
            }
        })
        return circularPath
    }

    public getSinglePath (vertex: T): T[] {
        const seen: Set<T> = new Set()
        while (true) {
            if (seen.has(vertex)) {
                return [...seen, vertex]
            }
            seen.add(vertex)
            const parents = this.redges.get(vertex)
            if (!parents || !parents.size) break
            vertex = parents.values().next().value
        }
        return [...seen]
    }

    public toTree () {
        const tree: Tree = {}
        const v2node = new Map([[this.root, tree]])

        this.preOrder(this.root, (vertex, stack, visited) => {
            const parentV = stack[stack.length - 1]
            const parentNode = v2node.get(parentV)
            if (!parentNode) return
            const childNode = parentNode[this.vertexToString(vertex)] = {}
            v2node.set(vertex, childNode)
            visited.clear()
        })
        return tree
    }

    public inspect () {
        return this.toString()
    }

    public toString () {
        return this.vertexToString(this.root) + '\n' + treeify.asTree(this.toTree())
    }

    private preOrder (vertex: T, visitor: Visitor<T>, path: T[] = [], visited: Set<T> = new Set()): void {
        visitor(vertex, path, visited)

        if (visited.has(vertex)) return
        else visited.add(vertex)

        path.push(vertex)
        for (const child of this.edges.get(vertex) || []) {
            this.preOrder(child, visitor, path, visited)
        }
        path.pop()
    }

    private circularString (vertex: T) {
        return `[Circular(${vertex})]`
    }
}
