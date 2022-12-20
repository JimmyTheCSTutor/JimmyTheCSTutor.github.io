// Encapsulates DOM information for both the code frame and the node in the graph for a given node.
const lineConstructor = d3.line().x(d => d[0]).y(d => d[1]);
class Node {
    static ACTIVE = 0;
    static INACTIVE = 1;
    static VISITED = 2;
    static LEFT = "L";
    static RIGHT = "R";
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.lineIdx = 0; // Each frame already starts at line #2.
        if (typeof nodeId === "string") {
            this.lines = [1, 2, 3];
        } else {
            this.lines = [1, 2, 5, 6, 7];
        }
    }

    getCurrentLineNumber() {
        return this.lines[this.lineIdx];
    }

    advance() {
        this.lineIdx++;
    }

    restoreCounter() {
        this.lineIdx = this.lines.length - 1;
    }

    retreat() {
        this.lineIdx--;
        this.lineIdx--;
    }

    valid() {
        return !this.isNull();
    }

    id() {
        return this.nodeId;
    }

    toString() {
        return this.nodeId + '';
    }

    // seems kind a hack?
    isNull() {
        return typeof this.nodeId === "string";
    }

    // DOM selectors for this node.
    getFrame() {
        return $(`#frame-${this.nodeId}-container`);
    }

    getGraphNode() {
        return $(`.node > title:contains(${this.nodeId})`).parent();
    }

    getGraphNodeFill() {
        return this.getGraphNode().find('path');
    }

    getConnector() {
        return $(`#connector-${this.nodeId}`);
    }

    getNull() {
        return $(`text#${this.nodeId}`);
    }

    // Manipulate DOM according to state.
    activate() {
        const frame = this.getFrame();
        this.markGraphNode(Node.ACTIVE);
        this.getConnector().addClass('active');
        const pre = frame.find('pre');
        pre.removeClass("inactive");
        pre.addClass("active");
        frame.find('.line-highlight').removeClass('inactive suspended');
    }

    deactivate() {
        const frame = this.getFrame();
        const pre = frame.find('pre');
        pre.addClass('inactive');
        pre.removeClass('active');
        frame.find('.line-highlight').addClass('inactive');
        // console.log(`about to remove active class from connector ${this.nodeId} `, this.getConnector());
        this.getConnector().removeClass('active');
        this.markGraphNode(Node.INACTIVE);
    }

    markGraphNode(state) {
        const node = this.getGraphNodeFill();

        if (state === Node.ACTIVE) {
            if (this.isNull()) {
                const n = this.getNull();
                n.removeClass("visited");
                n.addClass("active");
            } else {
                node.addClass("active");
                // THIS IS A HACK: assumes that the text label node is always the first node in the HTML.
                this.getGraphNode().find("text").first().removeClass("visited");
            }
        } else if (state === Node) {
            node.removeClass("active");
        } else if (state === Node.VISITED) {
            if (this.isNull()) {
                const n = this.getNull();
                n.addClass("visited");
                n.removeClass("active");
            } else {
                node.removeClass("active");
                node.addClass("visited");
                this.getGraphNode().find('text').addClass("visited");
            }
        } else {
            // reset the node to its original state
            if (this.isNull()) {
                const n = this.getNull();
                n.removeClass("visited");
                n.removeClass("active");
            } else {
                this.getGraphNode().find("text").first().removeClass("visited");
                node.removeClass("visited");
                node.removeClass("active");
            }
        }
    }

    connect(activate) {
        // const root = this.getFrame().find(".function").next().next()[0];
        const root = this.getFrame()[0];
        const {
            right: startX,
            top,
            height
        } = root.getBoundingClientRect();

        const startY = top + (height * .19);

        const graphNode = this.valid() ? this.getGraphNode().find("text")[0] : this.getNull()[0];
        const {
            x: nodeX,
            y: nodeY
        } = graphNode.getBoundingClientRect();

        const buffer = 10;

        const midX = startX + (nodeX - startX) / 2;
        const points = [
            [startX, startY],
            [midX, startY],
            [midX, nodeY + buffer],
            [nodeX, nodeY + buffer]
        ]

        const c = activate ? "connector active" : 'connector';
        d3.select("#svg_output").append("path")
            .attr("id", `connector-${this.nodeId}`)
            .attr("class", c)
            .datum(points)
            .attr("d", lineConstructor)
    }

    // completely removes this frame from the DOM
    // Different than deactivate, is called when another node is placed on top of this frame.
    destroy() {
        const frame = this.getFrame();
        $(`#connector-${this.nodeId}`).remove();
        this.markGraphNode(Node.VISITED);
        frame.remove();
    }

    // restore the infromation about this node
    restore() {
        const frame = this.getFrame();
        $(`#connector-${this.nodeId}`).remove();
        frame.remove();
        this.markGraphNode();
    }

    // Insert code frame for this node.
    createFrame(counter) {
        const elem = $(`<div id="frame-${this.nodeId}-container" class="frame line-numbers"><pre data-line=${this.getCurrentLineNumber()} id="frame-${this.nodeId}" class="active"><code class="language-python">def dfs(root):
  if not root:
    return

  print(root.value)
  dfs(root.left)
  dfs(root.right)
</code>
</pre>
</div>`);

        elem.css({
            left: `${(counter) * 210 + 30}px`,
            top: `${(counter) * 80}px`
        });
        this.advance(); // lineIdx always points to the NEXT line of code to be executed.
        return elem;
    }
}