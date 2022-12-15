// Encapsulates DOM information for both the code frame and the node in the graph for a given node.
const lineConstructor = d3.line().x(d => d[0]).y(d => d[1]);
class Node {
    static ACTIVE = 0;
    static INACTIVE = 1;
    static LEFT = "L";
    static RIGHT = "R";
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.lineIdx = 0; // Each frame already starts at line #2.
        if (typeof nodeId === "string") {
            this.lines = [2, 3];
        } else {
            this.lines = [2, 5, 6, 7];
        }
    }

    getCurrentLineNumber() {
        return this.lines[this.lineIdx];
    }

    advance() {
        this.lineIdx++;
    }

    restore() {
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
        if (this.valid()) {
            this.markGraphNode(Node.ACTIVE);
        } else {
            this.getNull().removeClass("hidden");
        }
        this.getConnector().addClass('active');
        frame.find('pre').removeClass("inactive").addClass('active');
        frame.find('.line-highlight').removeClass('inactive suspended');
    }

    deactivate() {
        const frame = this.getFrame();
        frame.find('pre').addClass('inactive');
        frame.find('.line-highlight').addClass('inactive suspended');
        this.getConnector().removeClass('active');
        if (this.valid()) {
            this.markGraphNode(Node.INACTIVE);
        }
    }

    markGraphNode(state) {
        if (state === Node.ACTIVE) {
            this.getGraphNodeFill().addClass("active");
        } else {
            this.getGraphNodeFill().removeClass("active");
        }
    }

    connect() {
        // const root = this.getFrame().find(".function").next().next()[0];
        const root = this.getFrame()[0];
        const {
            right: startX,
            top,
            height
        } = root.getBoundingClientRect();

        const startY = top + (height * .25);

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

        d3.select("#svg_output").append("path")
            .attr("id", `connector-${this.nodeId}`)
            .attr("class", "connector active")
            .datum(points)
            .attr("d", lineConstructor)
    }

    // completely removes this frame from the DOM
    // Different than deactivate, is called when another node is placed on top of this frame.
    destroy() {
        const frame = this.getFrame();
        frame.addClass("zoom");
        $(`#connector-${this.nodeId}`).remove();
        if (this.isNull()) {
            this.getNull().addClass("hidden");
        }
        this.markGraphNode(this.INACTIVE);
        frame.remove();
    }

    // Insert code frame for this node.
    createFrame(counter) {
        const elem = $(`<div id="frame-${this.nodeId}-container" class="frame line-numbers"><pre data-line=${this.getCurrentLineNumber()} id="frame-${this.nodeId}"><code class="language-python">def dfs(root):
  if not root:
    return

  print(root.value)
  dfs(root.left)
  dfs(root.right)
</code></pre></div>`);

        elem.css({
            left: `${(counter) * 140 + 30}px`,
            top: `${(counter) * 80}px`
        });
        this.advance(); // lineIdx always points to the NEXT line of code to be executed.
        return elem;
    }
}