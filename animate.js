// variables for keeping of the state of the tree animation.
// the index of the NEXT step to execute.
let n = 0;

const ids = [
    ["node2"],
    ["node5"],
    ["node6"],
    ["node4", "edge5"],
    ["edge3", "edge4", "node3"],
    ["node1", "edge1", "edge2"]
];

const nodeIds = ["node2", "node5", "node6", "node4", "node3", "node1"];

const variables = ["ten", "eight", "nine", "six", "twelve", "root"];


// each step forward should draw a node, and possibly an edge. Only leaf nodes do not edges.
function nextTreeNode() {

    let line;
    n++;

    if (n <= 6) {
        const toShow = ids[n - 1];
        toShow.forEach(e => {
            $(`#tree-animation-graph #${e}`).addClass("shown");
        })
        line = n + 7;
        if (n === 6) {
            line = n + 8;
        }
    }
    addVariableAndConnect();
    $('#tree-step').text(`Step ${n} out of 6`);

    $('#tree-animation-progress').val(n);
    // highlight the next line
    // set the new data-line attribute for pre
    const pre = $('.animated-tree-snippet');
    pre[0].setAttribute('data-line', line);
    // delete the current line-height class.
    $(pre).find('.line-highlight').remove();

    var func = Prism.plugins.lineHighlight.highlightLines(pre[0]);
    func();

    $('#prevTreeNode').prop('disabled', n === 0);
    $('#nextTreeNode').prop('disabled', n === 6);
}

function prevTreeNode() {
    const toRemoveId = ids[n - 1];
    toRemoveId.forEach(e => {
        $(`#tree-animation-graph #${e}`).removeClass('shown');
    })

    const pre = $('.animated-tree-snippet');
    const currLine = parseInt(pre.attr("data-line"));
    const line = n === 6 ? currLine - 2 : currLine - 1;
    pre[0].setAttribute('data-line', line);
    // delete the current line-height class.
    $(pre).find('.line-highlight').remove();

    var func = Prism.plugins.lineHighlight.highlightLines(pre[0]);
    func();

    n--;
    removeVariableAndConnectLine();
    $('#tree-step').text(`Step ${n} out of 6`);
    $('#tree-animation-progress').val(n);


    $('#prevTreeNode').prop('disabled', n === 0);
    $('#nextTreeNode').prop('disabled', n === 6);
}

function advanceTreeNode(e) {
    const curr = parseInt(e.target.value);

    // stepIdx is always +1 of the step that was executed.
    if (curr > n) {
        for (let i = n; i < curr; i++) {
            nextTreeNode();
        }
    } else {
        for (let i = n - 1; i >= curr; i--) {
            prevTreeNode();
        }
    }
    n = curr;
}

function addVariableAndConnect() {
    const idx = n - 1;
    const variable = variables[idx];

    $(`#variable-row-${variable}`).addClass("shown");

    // add conection line
    const {
        top: parentTop,
        left: parentLeft,
    } = $('#animated-dfs').offset();

    const root = $('#animated-dfs').find(`.root-cell:eq(${idx})`);

    let {
        left: elemLeft,
        top: elemTop,
    } = root.offset();

    // Make this a percentage of the total width / height of the connector.
    let startX = elemLeft - parentLeft;
    const height = root.height();
    const top = elemTop - parentTop;

    let startY = top + height / 2;

    const graphNode = $('#tree-animation').find(`#${nodeIds[idx]}`);
    let {
        left: nodeX,
        top: nodeY
    } = graphNode.offset();

    nodeX = nodeX - parentLeft;
    nodeY = nodeY - parentTop;

    const X_BUFFER = 10;
    const Y_BUFFER = 15;

    startX = startX + X_BUFFER;
    startY = startY + 5;
    nodeY += Y_BUFFER;
    // nodeX = nodeX - (X_BUFFER / 2);

    const midX = startX + (nodeX - startX) / 2;
    const points = [
        [startX, startY],
        [midX, startY],
        [midX, nodeY],
        [nodeX, nodeY]
    ]

    const g = d3.select(`#tree-animation`).append("g").attr("class", "connector").attr("id", `connector-${n}`);

    g.append("path")
        .attr("class", "connector")
        .datum(points)
        .attr("d", lineConstructor)

    g
        .append("circle")
        .attr("cx", startX)
        .attr("cy", startY)
        .attr("r", 4)
        .attr("fill", "white");
}

function removeVariableAndConnectLine() {
    const variable = variables[n];

    $(`#variable-row-${variable}`).removeClass("shown");
    $(`#tree-animation`).find(`#connector-${n + 1}`).remove();
}

let animationCount = 0;


const wrapFunction = function (fn, context, params) {
    return function () {
        fn.apply(context, params);
    }
}

function playSteps() {
    const BUFFER = 650;
    const {
        start,
        end,
        container,
        stepIdx,
        toExecute
    } = this;

    container.find(".play").prop('disabled', true);
    if (stepIdx === toExecute.length) {
        resetSteps.call(this);
        setTimeout(() => playSteps.call(this), BUFFER);
        return;
    }

    for (let i = 0; i < end - start; i++) {
        setTimeout(() => {
            nextStep(this);
            if (i == end - start - 1) {
                container.find(".play").prop('disabled', false);
            }
        }, i * BUFFER);
    }
}

function resetSteps() {
    for (let i = this.stepIdx; i > 0; i--) {
        prevStep(this);
    }
}


function advanceStep(e) {
    const curr = parseInt(e.target.value);

    // stepIdx is always +1 of the step that was executed.
    if (curr > this.stepIdx) {
        for (let i = this.stepIdx; i < curr; i++) {
            const {
                forward
            } = this.toExecute[i];
            forward(this);
        }
    } else {
        for (let i = this.stepIdx - 1; i >= curr; i--) {
            const {
                undo
            } = this.toExecute[i];
            undo(this);
        }
    }
    this.stepIdx = curr;

    this.container.find("button#prev").prop('disabled', this.stepIdx === 0);
    this.container.find("button#next").prop('disabled', this.stepIdx === this.toExecute.length);
    this.container.find('#step').text(`Step ${this.stepIdx} out of ${this.toExecute.length}`);
}

// Renders a new row for the DFS animation, restricted to the given range of steps (start, end)
const renderAnimation = function (animationContainer, start, end) {
    // First create an animation container.

    // Render the SVG tree.
    animationContainer.prepend(makeTree());

    const scope = {
        stepIdx: 0,
        stack: [],
        container: animationContainer,
        animationCount,
        start,
        end
    };

    // I essentially want an isolated context for this animation which contains its own
    // array of steps, stepIdx, slider, stack of nodes, etc.

    // I think I want to .bind the event handlers of the Prev/Next Step buttons + the slider to execute against this context.
    const toExecute = [];
    for (let i = 0; i < end; i++) {
        const {
            forward,
            undo
        } = steps[i];

        if (i < start) {
            forward(scope);
        } else {
            toExecute.push({
                forward,
                undo
            });
        }
    }

    scope["toExecute"] = toExecute;

    animationContainer.append(
        `<div class="play-row">
            <div class="flex items-center">
                <button class="play">Play</button>
                <div class="mh3 slider-container flex items-center">
                    <button class="dim step" id="prev" disabled=${scope.stepIdx === 0}><</button>
                    <input type="range" min="0" max=${toExecute.length} value="0" class="slider pointer" id="progress">
                    <button class="dim step" id="next">></button>
                </div>
                <div id="step">Step 0 out of ${toExecute.length}</div>
                <button class="mr3 reset ml-auto">Reset</button>
            </div>
        </div>`
    )


    animationContainer.find('#progress').on("input", advanceStep.bind(scope));

    animationContainer.find('button.play').on("click", playSteps.bind(scope));
    animationContainer.find('button.reset').on("click", resetSteps.bind(scope));
    animationContainer.find('button#prev').on("click", () => prevStep(scope));
    animationContainer.find('button#next').on("click", () => nextStep(scope));

    animationCount += 1;
    return scope;
}

const steps = [
    // Node 5
    {
        forward: (scope) => newFrame(scope, 5),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Node 10
    {
        forward: (scope) => newFrame(scope, 10),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Null (Node 10.left)
    {
        forward: (scope) => newFrame(scope, "L"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Back to Node 10
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: (scope) => {
            newFrame(scope, "L", true);
        }
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Null (Node 10.right)
    {
        forward: (scope) => newFrame(scope, "R"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => {
            newFrame(scope, "R", true);
        }
    },
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => newFrame(scope, 10, true),
    },
    // Back to Node 5
    {
        forward: nextLine,
        undo: prevLine
    },
    // Node 12
    {
        forward: scope => newFrame(scope, 12),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Node 6
    {
        forward: scope => newFrame(scope, 6),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Node 9
    {
        forward: scope => newFrame(scope, 9),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Null (Node.9 left)
    {
        forward: scope => newFrame(scope, "L"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Back to 9
    {
        forward: scope => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => newFrame(scope, "L", true),
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Null (node.9 right)
    {
        forward: scope => newFrame(scope, "R"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Back to 9
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => {
            newFrame(scope, "R", true);
        }
    },
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => newFrame(scope, 9, true),
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Null (node.6 right)
    {
        forward: scope => newFrame(scope, "R"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Back to 6
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => {
            newFrame(scope, "R", true);
        }
    },
    {
        forward: (scope) => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => newFrame(scope, 6, true),
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Node 8
    {
        forward: scope => newFrame(scope, 8),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Null (node.8 left)
    {
        forward: scope => newFrame(scope, "L"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: scope => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => {
            newFrame(scope, "L", true);
        },
    }, // // Back to 8
    {
        forward: nextLine,
        undo: prevLine,
    },
    // Null (node.8 right)
    {
        forward: scope => newFrame(scope, "R"),
        undo: undoNewFrame
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    {
        forward: nextLine,
        undo: prevLine
    },
    // Back to 8
    {
        forward: scope => {
            popFrame(scope);
            flashLine(scope);

        },
        undo: scope => {
            newFrame(scope, "R", true);
        }
    },
    // Back to 12
    {
        forward: scope => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => newFrame(scope, 8, true),
    },
    // Back to 5
    {
        forward: scope => {
            popFrame(scope);
            flashLine(scope);
        },
        undo: scope => newFrame(scope, 12, true),
    },
    // Finished.
    {
        forward: scope => {
            popFrame(scope);
        },
        undo: scope => newFrame(scope, 5, true),
    },
]


// This function is called as a result of "undo-ing" a new frame that was added to the call stack.
// It removes the frame, and resets all the visual state associated with node in the tree.
function undoNewFrame(scope) {
    const toRemove = scope.stack.pop();
    toRemove.resetState();

    const nextNode = scope.stack[scope.stack.length - 1];
    if (nextNode) {
        nextNode.activate();
    }
}

// Removes this frame from the call stack.
function popFrame(scope) {
    const toRemove = scope.stack.pop();
    toRemove.destroy();

    const nextNode = scope.stack[scope.stack.length - 1];
    if (nextNode) {
        nextNode.activate();
    }
}


function newFrame(scope, newNode, restore) {
    let prevNode;
    if (scope.stack.length > 0) {
        prevNode = scope.stack[scope.stack.length - 1];
        prevNode.deactivate();
    }

    // IMPLICIT: if newNode is null, then prevNode will be non-null
    let nodeId = newNode === "L" || newNode === "R" ? `${prevNode}-${newNode}` : newNode;
    const n = new Node(nodeId, scope.container, scope.animationCount);

    // set current node active fill.
    n.activate();

    // if restoring this frame because we hit previous step, set the current line number
    // to the last line of the frame before creating it.
    if (restore) {
        n.restoreCounter();
    }

    // append stack frame for newNode.
    const elem = n.createFrame(scope.stack.length);
    scope.container.append(elem);

    // apply syntax highlighting.
    Prism.highlightElement(scope.container.find(`#frame-${nodeId} > code`)[0]);
    Prism.plugins.lineHighlight.highlightLines(scope.container.find(`#frame-${nodeId}`)[0])();

    scope.stack.push(n);

    // Add event listeners so necessary Javascript executes when animations end.
    elem
        .on("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd",
            (e) => {
                if (e.target === e.currentTarget) {
                    if (e.target.classList.contains(Node.DELETE)) {
                        elem.remove();
                    }
                }

            });

    return n;
}

function prevLine(scope) {
    const curr = scope.stack[scope.stack.length - 1];
    curr.retreat();
    const id = scope.container.find(`#frame-${scope.stack[scope.stack.length - 1]}`);
    highlightLine(id, curr.getCurrentLineNumber());
    curr.advance();
}

function nextLine(scope) {
    const curr = scope.stack[scope.stack.length - 1];
    const id = scope.container.find(`#frame-${scope.stack[scope.stack.length - 1]}`);
    highlightLine(id, curr.getCurrentLineNumber());
    curr.advance();
}

function highlightLine(pre, lineNum) {
    // set the new data-line attribute for pre
    pre[0].setAttribute('data-line', lineNum);
    // delete the current line-height class.
    $(pre).find('.line-highlight').remove();

    var func = Prism.plugins.lineHighlight.highlightLines(pre[0]);
    func();
}

function flashLine(scope) {
    const curr = scope.stack[scope.stack.length - 1];
    // adds a css animated flash to the current line to indicate that the line has just received a return value from a popped frame.
    curr.getFrame().find('.line-highlight').addClass("flash");
}

function prevStep(scope) {
    const {
        container,
        toExecute: steps
    } = scope;
    scope.stepIdx--;
    const {
        undo
    } = steps[scope.stepIdx];
    undo(scope);
    container.find('#progress').val(scope.stepIdx);
    container.find('#step').text(`Step: ${scope.stepIdx} out of ${steps.length}`);

    container.find("button#prev").prop('disabled', scope.stepIdx === 0);
    container.find("button#next").prop('disabled', scope.stepIdx === steps.length);
    // container.find("button.play").prop('disabled', scope.stepIdx === steps.length);
}

function nextStep(scope) {

    const {
        container,
        toExecute: steps,
    } = scope;

    const {
        forward
    } = steps[scope.stepIdx];
    forward(scope);
    scope.stepIdx++;
    container.find('#progress').val(scope.stepIdx);
    container.find('#step').text(`Step: ${scope.stepIdx} out of ${steps.length}`);
    container.find("button#prev").prop('disabled', scope.stepIdx === 0);
    container.find("button#next").prop('disabled', scope.stepIdx === steps.length);
    // container.find("button.play").prop('disabled', scope.stepIdx === steps.length);
}

function makeTree(height = 300) {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%"
    height="${height}px"
    id="svg_output_${animationCount}" xmlns:ev="http://www.w3.org/2001/xml-events" style="overflow: hidden; ">
    <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" fill="currentColor" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
        <pattern id="rough-5641711627558583" x="0" y="0" width="1" height="1" viewBox="0 0 14 28"
            patternUnits="objectBoundingBox">
            <path
                d="M0.8241783960414825 -0.04702769066978052 C0.5270590914783029 0.4830968477701596, 0.30650931118890856 0.8317202727137833, 0.1046929197918155 1.0102093396554819 M0.8144894108427848 0.023542090743462238 C0.661937884378303 0.23613454618897634, 0.48452777494779564 0.46882141705247105, 0.008055308208769527 0.9312542243268966 M6.2227673939358406 0.432464118318424 C4.928393708027619 1.360930131742285, 3.336873779456512 4.112119145879411, -0.3196232032941504 6.5468587408888235 M5.7880425580814645 0.28577558004681475 C4.092162213834823 3.24111854823438, 1.6437288697413353 5.644045069585231, -0.11338994812087361 6.89754411300588 M12.275684074250648 0.018078091487563563 C6.415890431044132 4.358108421166383, 4.327562710720322 9.957572600469515, 1.606250909569273 13.535120377510482 M11.989883132041994 -0.2963708210734407 C8.367302773425347 3.6792951504369573, 3.795959284841373 8.912310225833373, -0.8021986195884688 13.03282375715163 M12.63858754327177 4.540156833829025 C9.79444288057402 8.362978490521822, 7.157415306291097 13.923056504324702, 1.2928776351030846 21.183340659853123 M13.66702194775855 3.5134337876263486 C9.352692096180242 7.924345855125837, 5.0997082990599365 12.51961415553269, 0.9754935861612766 19.040704181896977 M15.296585738959628 8.435327229474765 C11.21731462864161 12.044575910710392, 8.04525478312491 14.980197786693774, -0.4996755949829623 25.130059903922785 M13.211315871746855 9.708830342537686 C9.90195926831342 12.998448611909694, 8.213019179356142 17.378911157433027, 0.30833576845384636 26.120782604271064 M15.515800986271817 16.101941651932542 C9.354631795188578 19.66409813811488, 3.6649055038204854 26.07429083571648, 1.921371593397652 27.194649689013488 M13.605718602976232 14.486502722546117 C9.360820383788653 19.876373704522326, 6.313618497738678 25.30487559336747, 2.5723854233676624 28.033704151352968 M14.520213982181287 21.863537442943674 C12.863024395159275 22.018842501806827, 11.4731043929426 23.41440944347454, 8.68383669236117 28.977975100282187 M14.380964897309354 21.356932128522903 C11.513276561115553 24.106877771447692, 9.26411621643241 26.645071797318337, 8.311717112322617 28.068181006303334 M14.250840834682162 27.439595012741464 C13.869483077640663 27.566730481474966, 13.764323641395343 27.75718817347131, 13.248008995278612 28.192809110233092 M14.184416034194015 27.372867998521823 C13.894603499890835 27.57091033276857, 13.79384099189011 27.80599237761457, 13.405883335255849 28.30612830125033">
            </path>
        </pattern>
        <pattern id="rough-7116142215517475" x="0" y="0" width="1" height="1" viewBox="0 0 8 11"
            patternUnits="objectBoundingBox">
            <path
                d="M3.393690325669098 0.4707006752286834 C2.3937439444186226 1.2688760285719907, 1.040899988554167 2.4975413800885207, -0.38023116403024637 3.760937777739272 M3.05117994978683 -0.17891119793508517 C2.4817820654218568 1.0413263734864278, 1.4437334341643502 2.43452875069819, 0.14447880697113713 3.6998744286574867 M8.124248705493647 1.463227870135934 C5.162198319805015 2.3262714325232046, 3.791137471556145 6.64034300962234, 0.9708196545091081 9.455383050591422 M8.004214710898209 1.6776099849612613 C5.093254260805453 3.899017821606459, 2.8437451046328226 6.026620401160906, -0.11606885776238152 10.108948880522398 M7.883130240094844 7.662073592177609 C6.330334703462678 8.642367285759299, 5.770437041427598 9.310494472666933, 4.746062541276986 10.50250980266039 M7.741490711648996 7.344883109613815 C6.48501592268509 8.372469689358175, 5.434781736061081 9.602466439062292, 4.695198973041138 10.686269624575786"
                style="stroke: rgb(0, 0, 0); stroke-width: 0.5; fill: none;"></path>
        </pattern>
        <pattern id="rough-5694296840607001" x="0" y="0" width="1" height="1" viewBox="0 0 14 28"
            patternUnits="objectBoundingBox">
            <path
                d="M0.9195743446532463 -0.01230740337693459 C0.6617958592993115 0.3584441380366467, 0.1748101905000385 0.6203029872390006, 0.1282054100794259 1.0844820766497267 M0.9081375621559005 -0.05923429472004163 C0.5230376721728913 0.3358837691375056, 0.30610247289014336 0.5808936120889221, 0.0037715584112896494 0.982494258989355 M5.318160083119727 0.7284354719948553 C4.538288216930974 0.5561263922549771, 3.7646331638395827 3.1676328873939026, -0.5032902666576717 7.71574433608927 M6.157875827847027 0.21895485447882163 C4.38991654227106 1.7641677138483278, 3.0185222663698466 3.413135456547357, -0.10569730843819486 6.6804315127496405 M11.321709467543593 0.3086647410562051 C6.908697416464924 5.626963432871026, 1.641738647195312 9.19116432998965, 0.40406610843154134 12.403160755223592 M11.369393204428334 0.1014920395830663 C8.828776514320435 4.28679935962827, 3.763873406940571 7.226240450851483, -0.16914277887059925 12.365873539214016 M14.267935068124167 1.3738108714281871 C11.631788213995476 6.418189924473311, 9.243529668082324 10.226541310326969, -0.386867917861883 20.492606442045084 M14.020979754483509 3.7956132873641533 C9.674548640980206 7.1988119603837175, 6.732342465076277 11.888416350624778, -0.6435699533264527 19.031962397340997 M15.409003913533441 8.097609347662855 C9.470394057742247 16.640555003396727, 2.0096391231900226 21.44050429323192, 0.5634288227250472 24.533382255643 M14.886408457020895 9.151224596252653 C10.859894878653392 13.066475037533202, 6.6236007800586005 18.026294279523793, -0.5499568607065335 25.959687315184667 M12.454943482928822 16.241345044565513 C9.338962925223758 19.346731964645482, 6.499911243682795 22.65774213525707, 4.089750560963456 27.97376634285202 M13.809658648584428 15.28786144190156 C10.90810157344815 20.164219313928434, 5.799858516250504 24.622332877815573, 2.687015278603478 28.80644639793836 M13.30986798918772 20.828134442331624 C12.63566209380863 23.86259108499553, 11.4559655476645 25.119056587299735, 8.649982571728799 28.178381155844573 M13.99211155447584 21.395728588769444 C12.490944766926741 23.968477717583337, 9.779144732512211 26.533771652459034, 8.475342866718545 28.172739908624767 M14.198621274682704 27.36944810707579 C13.994591614859065 27.62967599361888, 13.64393690103391 27.796880425090173, 13.320432490196403 28.221970916423462 M14.13962191242992 27.334981411053025 C14.003061633833628 27.616466783609777, 13.70506440282063 27.86497311720365, 13.297837891895371 28.294808874622735">
            </path>
        </pattern>
        <pattern id="rough-6643234192878235" x="0" y="0" width="1" height="1" viewBox="0 0 8 11"
            patternUnits="objectBoundingBox">
            <path
                d="M3.3139911652670504 -0.03099862067650333 C2.354775937913538 1.132565566038512, 0.7967035380732574 3.3162808237507453, 0.3261178034980884 3.813746678971839 M3.2377528189890965 0.2346495892308027 C1.9596319233632307 1.4871799573354005, 0.9411203948831839 2.970166047412017, 0.05538424103206335 3.76306108962305 M7.940782155693972 2.1923971172004695 C4.762434058776294 2.8474629001651586, 4.102775820659466 6.075919458894959, -0.6728285349118321 9.974977213152783 M7.339174585932289 1.6650613712728948 C4.495860464668666 4.276876414216499, 1.0336206635432754 8.38800070466731, -0.03573438384716909 9.556562905109617 M7.699250680746746 6.985876827920114 C6.840035028415411 8.05851024802982, 5.6823035396779815 9.738861985373093, 4.7587814486539575 10.780146348072542 M7.734134222529829 7.296406808302616 C6.802326848892285 8.245879161568675, 5.638537660112281 9.538825103401882, 4.7609369790149625 10.444455329111227"
                style="stroke: rgb(0, 0, 0); stroke-width: 0.5; fill: none;"></path>
        </pattern>
        <pattern id="rough-278072312222209" x="0" y="0" width="1" height="1" viewBox="0 0 14 28"
            patternUnits="objectBoundingBox">
            <path
                d="M0.8649386300195954 -0.11741967699530578 C0.6653633615708343 0.22438449958014792, 0.3372774080878723 0.47852886445055454, 0.0026977413313837018 1.036281741189622 M0.8154870124399555 0.06320484243005942 C0.6701330345935333 0.24932386443923507, 0.39113428509861586 0.48378025538366376, 0.05396524671084123 0.9736092021824718 M6.402015904607921 0.798673521809844 C5.001955118311029 0.921923330014229, 2.7420803991899363 2.523743920602489, 0.22203343270581755 6.314759562713938 M6.259900202073319 0.4024677282237392 C4.119055795310422 2.335495624208496, 2.046463320035612 4.420977947718433, -0.3970517503486668 7.044931944465469 M11.689656122575599 0.963089958954306 C6.114297314289835 4.5358140393751105, 1.6669010397335469 11.908012609339835, 1.2255406762903955 12.19921520633854 M12.088948710282626 -0.3972819678150585 C8.40132269965686 4.614328653785384, 4.913883890728848 8.00663685439722, 0.3830993154312642 13.960466491855449 M15.955568314433506 2.8121507080216803 C9.469938756385336 7.403186801859361, 5.669413032339893 14.626155252955506, 1.0228927899035742 19.748906135231728 M13.560945951487124 2.4175581337437344 C8.425774931247812 9.673779027045924, 3.3459565177548938 14.723960223440109, -0.4070182030580609 20.220276481645836 M15.553050126266124 9.502773037498766 C9.942975613164922 13.046218157973883, 9.894845947620944 17.017590306641967, 1.6893575486571457 25.507446245101903 M13.756315632781071 8.346683835819395 C9.220908978483472 14.799960228255184, 5.903910078685865 18.466871458892008, -0.2624016991263134 25.385125610096765 M14.740876411698341 15.944617944904167 C11.525323664912605 20.302786041595123, 8.281965049575998 23.766408654951125, 1.341426271762305 27.77564543223002 M14.549178340837239 15.528723069672205 C11.884075054385905 18.54316238848464, 9.095777193869427 21.376224802885666, 2.095145966222101 27.458200715643446 M14.442763726461246 20.739287612343563 C12.91889664205982 23.498218389076744, 9.486495263110259 26.42091014199063, 7.483659151672575 28.857311880547496 M14.527012973267817 21.07921612745651 C12.051519491583784 23.11541306841875, 10.937572574920855 25.45900273233385, 7.782037234215841 28.391292847589305 M14.232937112520396 27.285726692517777 C13.830519591801522 27.74927100341362, 13.76232757770487 27.90589692628215, 13.25258051000206 28.319170253636283 M14.133073655838976 27.35822106455297 C14.017984656047474 27.532392319849997, 13.80205889027021 27.776274473389623, 13.386723239262446 28.244104142970322">
            </path>
        </pattern>
        <pattern id="rough-8478495387468595" x="0" y="0" width="1" height="1" viewBox="0 0 8 11"
            patternUnits="objectBoundingBox">
            <path
                d="M3.0395108230227867 0.17039533142885332 C2.0690580857963545 1.1592593883117175, 0.684953583563996 2.2185458654639243, -0.4092056763281601 3.760305457407261 M3.061626109587422 0.006727618661768353 C2.8344747023143118 0.6241803939037781, 2.0463659483999566 1.736302807672002, 0.24466738682121758 4.010381496233109 M6.867825706449335 2.2390976526219166 C4.264364909586287 4.610471442831885, 3.6927614321186857 7.62158925666557, -0.7058345265157306 8.92319277284027 M7.564368833059935 1.2448953221275905 C5.438336670556105 4.103120141617901, 2.5281752664561843 7.140229122123361, 0.1781604950576241 9.491144264570456 M7.547117505660821 7.437956974817868 C7.321379564202698 7.688014408945236, 6.787710988889801 8.17945938764249, 4.74020400475132 10.16065609800535 M7.437607948014488 7.058930727648236 C6.684406689246449 8.287974986499082, 5.625406272413642 9.14940144490185, 4.901269421541275 10.425293969563512"
                style="stroke: rgb(0, 0, 0); stroke-width: 0.5; fill: none;"></path>
        </pattern>
        <pattern id="rough-3160897311706635" x="0" y="0" width="1" height="1" viewBox="0 0 14 28"
            patternUnits="objectBoundingBox">
            <path
                d="M0.7542378467564121 -0.04393755152278578 C0.6343484486695674 0.21566697916756433, 0.3668518184215701 0.5339364730571986, -0.051694034553533205 1.09680932952147 M0.8632467136800902 -0.053383412270683855 C0.6383621136851484 0.23249009716226235, 0.46399388264351993 0.4486466486437755, -0.01751688303401365 0.9556559598374798 M5.42505498906573 0.5285660003104706 C4.828405113171259 2.777382252175224, 1.34113535063136 4.142649760913118, -0.8052719620699424 6.262380712617711 M6.248886877751798 -0.04336706233091553 C4.327941648372226 1.892375323995682, 3.276821284602427 3.9131447257361414, 0.04187748085584497 6.829328968584358 M10.659372047562707 0.32164288867362756 C9.890131419012716 4.141546346542926, 7.484038270241833 7.778725804849795, -0.218118368000648 14.855333431661268 M11.83062015479348 0.4377044610885722 C7.2254052588963225 4.959209678229122, 3.043921087296526 8.678967722780289, 0.15912094421009437 12.667182975316008 M12.9685577386434 4.588445452537817 C9.90799257048464 6.594567428541394, 9.277986739064286 9.161530934970248, 1.085734380051492 19.149720680171665 M14.561313467616209 3.4358541166245744 C9.78771184249096 9.481971527305179, 4.553397022184311 14.449852033523605, -0.8054853492014651 18.42650179561353 M13.328774562830683 7.26409013295634 C12.701429373779547 12.615552488545406, 9.894858989063547 13.804619574319325, -1.0407391062947875 24.369439157863116 M15.034048463635386 8.21405107029372 C9.814652043587486 15.175313410765572, 3.4370821482599885 20.816704848406406, -0.7438417171261995 24.999804158108905 M12.678575503690311 14.954766096697712 C10.56671288263083 18.683195710631544, 8.047707773084882 23.646723627136453, 3.0744237872649496 27.97987957371938 M14.463876022189421 15.04746109010775 C10.533668675543632 19.434457248367725, 7.286453053090986 22.94044018776694, 3.152900544630136 28.392846494590636 M13.968406193242087 20.68692052277161 C11.449287656727327 23.893602963490153, 9.821193667258662 24.77711703378524, 7.230370242496851 27.70204054763593 M14.083631113167671 21.529587655389076 C11.865991042904641 24.016103206012595, 9.848884193410463 27.036145722193616, 7.6757544382873295 27.947902470220104 M14.128831443633064 27.286789389501134 C14.015615030077361 27.643046554361973, 13.8547528698616 27.886537192367555, 13.419581942796658 28.18999811621451 M14.120708473948449 27.444807116313946 C13.850778821393385 27.7085701631559, 13.554319016641466 28.09378734566504, 13.301347704530414 28.335390994041095">
            </path>
        </pattern>
        <pattern id="rough-3701170521658375" x="0" y="0" width="1" height="1" viewBox="0 0 8 11"
            patternUnits="objectBoundingBox">
            <path
                d="M3.3718259470525482 -0.46312429794245014 C2.3411873715279885 0.5540067842122669, 1.8061242932567318 2.162773783923489, -0.4980630614283434 3.3668038081008875 M3.189776307945823 -0.24701416744035962 C2.1280663644574704 1.446643356921979, 0.8302069945361967 2.7241019148372145, -0.21821995140876227 3.706035880538718 M7.761279624226292 0.547291628930472 C5.225978913515139 2.659229429145425, 2.9403742017066143 4.970546244871402, 1.0701451479410327 10.488623283342356 M8.10003289908648 0.9428807796412011 C6.385297629105679 2.8580894576267903, 3.823669070711034 4.9189511236307375, -0.4334839314358431 9.578418092098474 M7.463638530969562 7.564507197367044 C6.382084645007831 8.459395676517676, 5.911119031089988 9.809313022961998, 4.754752854481129 10.173236422797034 M7.726204626230905 7.292523704297379 C6.666447282653306 8.504787552835047, 5.922636526962189 9.472886311838455, 4.89234455962903 10.647631178779672"
                style="stroke: rgb(0, 0, 0); stroke-width: 0.5; fill: none;"></path>
        </pattern>
        <pattern id="rough-4560223390810273" x="0" y="0" width="1" height="1" viewBox="0 0 227 347"
            patternUnits="objectBoundingBox">
            <path
                d="M0.28637659936228727 -0.004339886164924693 C0.18716084739754552 0.06285144094518451, 0.08520477266835849 0.15450415461684974, -0.0019937735671841164 0.3103895602482996 M0.3040211549730689 0.004252550531010431 C0.1782257591707387 0.10233818363524616, 0.1022178251743886 0.20989077486204616, 0.012024145017602014 0.3213221859380593 M5.956203050202642 -0.5069093070530966 C3.704542685267726 2.7474390372474655, 1.298969614957782 5.409023655710409, -0.7196415118711218 6.513600610402429 M5.261967597433735 0.21687814403883288 C4.24593938110164 1.57554210308188, 3.168387352616239 3.1044256021153, 0.028844495174456197 6.6662299135005725 M10.982555414678036 -1.5869799999683356 C9.10847850718507 2.3698197173127724, 4.1871466617064605 5.748159392583524, 1.2095137829502756 10.958763389287597 M10.898073299822272 -0.5066743113227732 C7.302668245792992 4.960308549076539, 2.0280500318743293 9.989246443917187, 0.36505536353100076 12.984335337903929 M15.516202155481576 -1.8688255720317342 C8.309952583271656 5.37413371260223, 2.4429616183966187 15.096073231381244, -0.7638351482678845 20.486047931219986 M17.041978435590963 0.6544365572667372 C12.414088297091276 4.389805464379323, 6.31939446806569 11.005875422550496, -0.1521721350331382 18.686714483355864 M19.529540040153545 -0.8210663536905809 C16.092054210537594 9.089126659157914, 5.507034630079101 16.358698728794437, 0.9436217092592596 24.509575838597243 M21.554810609789733 -0.057804391406342415 C15.576643056264702 6.527152372086519, 9.280272755427776 13.173144750401361, 0.6476676302581614 24.454398897513446 M27.356305776917687 0.7428079626898265 C20.40105844192304 8.187562014791848, 11.55074810382788 19.8869618478779, -1.8597583221902312 30.144204122507034 M27.470845694465464 0.9380425669163985 C17.03387170745339 11.533928606316357, 6.803327792003492 22.30244839929542, -0.8760682101777117 31.522977440906928 M32.569969340132545 -1.9020582401394588 C20.485647453062327 12.35467559053063, 12.501191719174965 24.232622575830867, 0.11686616158807439 35.997962287847216 M32.83885742024398 -0.5035553466206024 C21.433798657907484 10.222960224862309, 11.225274305835889 21.444782941879087, 0.9499234877797655 36.304920326204 M36.49353286209893 -1.9855831094321914 C22.855594738845184 12.787164912554491, 12.097638258690893 30.53528200878247, 1.6256969985841963 43.99351648734894 M36.508114670264945 0.9764951942444 C26.74236333451503 13.293341393525147, 14.071385106030585 25.27440002672362, -0.8775226152942905 42.35179169945773 M43.72132579610506 1.3074527184108362 C30.87428674049906 16.450421551764027, 16.904462799369426 31.49463142323593, -1.4069246456291573 50.86179079722126 M43.47833855615548 -0.8862764977712727 C31.62100013107322 11.561538827605663, 21.60795807623155 22.09930378887919, 0.9778449300752672 48.227478548761155 M48.67530977778816 -0.5937356839317482 C33.21877430429533 15.418418877663385, 19.818831967247597 31.86226856384933, 1.7782555165346992 53.776950381411616 M47.47178664387478 -0.019668602708258653 C37.745942194105375 11.583854968860145, 26.48969418427084 24.002759944007412, 0.07506635952086294 55.157362209647296 M53.3440257462483 -1.056350946400051 C36.23402490659162 15.337999941858275, 24.241905978531985 34.720246327972134, 0.4005684969973 63.20030715682781 M53.051035978083696 -0.07940604824460529 C33.46055556043518 23.928568462974862, 13.46676537229742 46.48286848802909, -0.6229074599067106 62.05570889502815 M60.53524855510752 -0.11954630806352728 C37.07588712266292 22.46570240183544, 15.90533464053997 48.60137506143215, 0.1385527052545834 65.66297022674377 M57.993208979677824 -0.14132092416873077 C36.45029904855443 24.533858124026644, 14.586284501236282 48.905161236466505, 0.4807308169803224 66.79419318891749 M64.3229105483755 -1.1233104617854988 C41.146141909579924 29.576419334510256, 17.466651366993993 56.56869236803796, -1.068861309306472 71.76746914452708 M63.441867983716136 -0.5465587131934426 C46.50713906741663 22.599550287682717, 27.310861340847296 43.25608909889043, -0.7310054690477896 74.11896328143256 M67.26968760763735 -1.2859515471047116 C53.246418676123376 18.334836071060767, 40.4590984373324 34.60372153433575, -0.7471796012892193 80.53962133991132 M68.28316468534267 -0.280857886447043 C43.06483966815438 30.654791112634964, 18.2585792782756 59.74348523636182, 0.9275007739084637 79.90954652568276 M73.81941980968043 0.3798520045095737 C47.1508608016387 31.47088583208194, 22.70232936996417 62.85222967338241, -1.4661190779006406 85.76132405272399 M74.64592630879162 0.861059866635173 C47.63053510522276 31.613377727515683, 20.515727440371464 62.497529379973734, -0.21244558723235674 86.41809087590626 M81.27547591672585 -1.3500816034449068 C63.22763944256138 19.738853448840636, 45.241821833555996 43.70143586851333, -0.0541008644343135 93.56112580162096 M80.29461026046144 -0.6049459250613789 C54.092991881904844 28.706618036505184, 28.766514790127506 58.9518229362708, 0.34778697251829804 91.4766234019314 M83.39359814380043 1.2481189597021487 C53.27843681194469 39.52980372448612, 19.4534120046451 76.10853133531377, -0.4579639580166228 96.22257617547662 M85.18521920628056 0.9582401557522631 C61.05213862962762 29.0020472328465, 37.65083745833077 57.30336763720568, 0.49015376773089736 98.8697872571887 M89.85651830594934 0.876241491863949 C59.55630863317633 35.64769041915672, 24.88155398868332 73.97357342483562, -1.0938412901389434 104.11626822723144 M91.22323566380366 0.044006777553284415 C70.13044839839462 22.011906820724835, 52.65257445687677 44.58886479847499, -0.47452827039612044 103.25328487385394 M96.41610085119304 -1.4774185276844705 C63.11704764492157 34.44873081219919, 31.619993285818204 75.01175299679079, 0.5791811183585658 111.48875526242868 M94.75882077256873 -0.8459655947838138 C66.8101005550225 32.415224286493405, 36.64126477542567 66.98228561945642, 0.352280386017489 109.27306189263167 M101.93668332370507 1.9251799591041188 C66.65060941345423 36.08603767138531, 35.128537383570624 78.1204785392277, 1.2093132067167325 116.2884530483587 M101.08973947834897 -0.04289420353016604 C63.082306699511356 44.42725199523659, 23.753703991508722 91.08236838269681, 0.16992572677414763 116.62800166316296 M106.39900879839824 -0.6498101831578476 C84.93603497034542 25.078817568846368, 65.90210114547324 47.69368890378589, 0.9666277484818337 123.92820506887726 M105.3089420171596 -0.5284784545349295 C83.15856481608431 26.496449347888177, 58.91949093892035 54.48195319438018, 0.6422307899075386 121.45155288011871 M113.07897247246751 0.6728672628993548 C71.53562963022517 45.6753125330348, 32.74640832815923 90.94994936656033, -0.9178762601457207 130.14100086497004 M112.16103935464614 0.24742319391481882 C68.79071778709184 48.95281303227376, 24.726314294457808 99.22839609550626, 0.33974291616824814 128.14129130076861 M117.3418151165017 -1.2441510281934294 C77.13667849085083 45.18493105883034, 34.53078613025798 92.49596657028599, -0.8259704639723413 133.60090121056342 M116.22562075038661 -0.9192518413117194 C80.06126245750423 43.34507082123913, 40.4062739708844 87.76758784624712, -0.01269651507316949 134.44099897844183 M121.09253719441814 -0.03754209028758648 C82.14366220396823 50.25605947222221, 40.368967295497164 95.87681338122083, 0.5506188614187346 140.6234172596711 M121.5561814927971 -0.539808853147766 C96.58015671493045 29.41467040510694, 71.1111134594092 58.29204459297278, -0.6292856011015964 140.04839121644432 M125.89370668247012 -0.5752314124134079 C86.72906699525682 43.15885872566896, 48.55769013541023 84.10101452813193, -1.4434408276708668 146.38823541004976 M126.52572139386002 -0.15575914189204543 C90.40559385420812 41.87475422124704, 54.32411558910824 83.66349093473653, 0.9831217240919452 146.8961449173128 M131.0482825596117 0.10981291658024528 C106.37630860812465 30.679801725416752, 79.01358385293494 63.93396633409726, 1.9250818608881932 152.30154415916383 M131.95711551195564 0.3097607691089288 C101.32127180394178 35.9943076256423, 70.70399744334495 71.7226904569392, 0.48983813376296803 152.80523710490942 M136.5425675822794 -1.5405179295997193 C103.43390379274084 39.10436751567125, 65.20972005170029 80.47744742055201, 1.9281528846385454 158.27940397853254 M138.53260729096175 0.9110275061088315 C108.49095904792294 33.0278692692621, 79.19286483537508 67.66706598104003, -0.48199266171594335 158.1746199070366 M142.75928875371054 1.2198982980237512 C106.54122386120021 41.84413176903852, 68.14214949497917 85.49397637932353, -1.932782878147571 166.70907438922944 M142.85754462643715 -0.050676459956151554 C100.3654268248394 49.420771157546596, 58.26486159451817 98.3190696525097, 0.44170616520069306 164.51138991583312 M147.7211105095199 -1.426732027955711 C89.56415642712581 65.95360482697984, 27.553742954566594 136.51532373952367, 0.5764742846832815 169.49167443695114 M149.2423972828046 0.4562824116811872 C102.30665543662852 55.32827623129602, 53.69961205612502 110.99579561664727, 0.2053375529057928 171.05472213074233 M155.3512268760124 -1.3523694663335784 C97.74149222010561 66.10007740454628, 36.91486947453929 133.16818228584708, -1.1960461305595995 176.21374608004078 M154.50834016393148 -0.18631687035752886 C114.86651152209551 47.80407153979133, 74.08083875684422 94.70290632405063, 0.1535317622770762 176.74258596303585 M161.22860103261056 1.2550321802252045 C101.03865552624876 65.30439884744061, 43.32405859302466 134.19563377526885, 0.8888948303696296 184.92263064779053 M158.47155770066237 0.6751865600838065 C121.91621984500696 43.56279207090114, 83.58493163370397 88.25194650241937, 0.29746303345862657 184.17125739665025 M163.24392238175432 -1.673975253537253 C99.41263404196461 71.91761134063704, 38.408295065095324 141.17976032222143, 0.9891298144592762 190.44623520300343 M164.40047408589808 0.3263106684994428 C116.46565785074962 58.696141767698954, 66.14669745241555 115.66728235815893, -0.5183618509714183 190.27486898689588 M168.34136316799942 -0.503026387516142 C118.78772435914347 56.869286073256426, 69.98385589918558 114.36361715374173, -0.9000718483641794 195.88185489454082 M169.88305558526505 0.5225947083554838 C102.29765139165626 76.06538073648599, 36.71199508943715 151.98163284161075, -0.8661274140002115 195.07188302984846 M174.71006668274524 0.3808306522504967 C131.08700554347928 53.22027007588482, 82.92614229697243 107.40775894239714, 0.08957408941517553 203.47111224154787 M174.63156351856682 -0.17321397367503621 C131.90237167569077 51.042006989274796, 89.78900737365775 101.0663955104576, -0.09829517627810747 201.60140972536476 M179.8699074428147 0.3810394075601833 C125.89419553525009 62.06310841029834, 71.4744973605462 124.28546245034613, -0.6186010770793002 209.42472766464226 M181.1279997762047 -0.22555148024130167 C135.4244272882028 50.33926824897625, 89.63046126323343 102.67382690552314, -0.6672137622960479 208.209496203752 M186.45511090392296 -0.8530582713260584 C138.75563518878914 50.60077644385048, 95.59677902994162 101.95982309641467, -0.461160864028189 211.77495906485956 M185.78747536222232 -0.8716170665759817 C138.21836186159487 54.041828284191276, 88.76351496050133 110.0119952434523, -0.6305040629328467 213.67916701255737 M191.7084618613543 -0.4885475635416556 C149.90345840188613 46.408498982055654, 111.5695882367024 92.25930910388257, -0.3517189294095351 218.84567713648423 M190.56550150021033 0.9377801654022222 C142.46377177991826 58.083504435575804, 93.44073276289352 114.32086064248257, 0.12673287897909136 220.05355903775848 M196.40786244899778 -0.8288218525849915 C139.28200992845154 65.0927616313971, 82.18562249757983 133.87181855154452, 0.5129215004026886 226.8952455673301 M197.07482138357548 -0.10089116497000017 C151.36606522059375 47.98898956641317, 110.08943422826529 97.73679866483637, -0.7716054384418465 225.50532056218557 M200.22362037802137 0.454401413974038 C154.1591221685391 54.41152152060515, 105.76601328211765 109.15062975649252, -0.23067381735005288 233.2757151211593 M201.34164490630553 -0.07217228238120033 C140.54172234626506 70.17210616347012, 79.63973119964798 141.67459111526074, -0.31792176861298227 232.58085338759443 M208.03813045498632 0.6403908918020429 C147.54166540926485 66.46724596458301, 86.84019768458072 137.30926363718422, 0.9448493988803843 236.58551372369126 M206.75433904882595 0.28564578378184535 C133.6525324981905 81.92126834822189, 63.767389885521766 161.63540937012647, 0.6171171518171024 237.89978499794105 M210.33146599455537 0.23015309246840676 C134.13006761060802 93.99825639290017, 50.87323214467301 185.6967920200526, 0.8974338192278966 242.54966579992012 M211.44615699751836 0.23715677567304416 C161.6550524847239 54.682481422570646, 113.34794258147562 112.39947819389722, -0.47900595252005695 244.86659317685223 M218.19623774889106 1.9518888689808707 C136.62991882045515 93.5362494453556, 56.800721536009355 187.62770628425005, -0.19155642106660142 251.36173606232325 M217.29627577918575 -0.5542735377369064 C172.45177047081495 52.28738689241137, 125.39723705297642 105.87564783289284, -0.5634933231375321 251.26488364395598 M224.0606265010909 1.6379790547173085 C164.11333737825757 66.47261223397372, 101.42963999624683 137.72114976882844, -0.2976300247065815 255.16594921837915 M221.96319519641912 0.005741016718988412 C138.26345624784733 94.18222062890291, 54.94241099937679 190.8880015985568, 0.6913466874420062 257.095917551513 M226.75059603116088 0.2553182357890167 C177.46735246364528 54.91240383155827, 131.3584395223114 107.60086092837193, -0.26605656201003125 262.16324928272076 M226.99432440006348 2.3762141680696653 C151.8300263139576 92.20839985169657, 73.49882287297811 181.39504133398378, 0.20589363422448903 263.11769216003114 M227.46061837931154 7.183357960983305 C161.4855906575841 86.13439418120778, 93.76265074539592 166.22286857315078, 0.5176480230099596 269.41230776024474 M226.15199749811143 7.381606984580698 C141.2921666593535 105.36299554731586, 58.72441203848605 201.98943555199685, 0.1487745963211804 269.3839566820716 M226.3779011764721 14.808771241652103 C141.1687569130446 115.19946896957744, 51.791902233649 216.5113218457011, -1.590481301813261 276.5067390780569 M227.22089377372563 14.456904870675784 C165.38899033192826 86.27734085266327, 101.91738977797444 160.401639821741, -0.6148405991843644 273.88901123801406 M225.90283243693156 20.80511941323202 C166.03236924111698 88.63150718274623, 107.79542903619026 157.64346590706685, -1.5142614213194951 280.81219713403493 M226.12424355119248 19.717369163387758 C175.87059332760663 82.75448562731381, 122.37005104179575 142.56989105121062, 0.7246628144039722 281.05140539492754 M227.10661551717047 26.43076650721182 C133.68117236821453 130.08345988889462, 46.56107706206266 230.95324087631298, 0.6602927820920765 286.81538390829775 M227.09548532523894 26.52748334093932 C137.7674704016381 129.5366850046943, 48.406057482615374 230.3847297705775, -0.5839573407276317 287.58946481928297 M226.9580423198434 31.77238155009426 C152.67089749558426 118.04930297733108, 80.63221635299155 199.89909622386335, -1.8142334751016547 292.884582391762 M226.3809458847923 32.00466352144413 C180.64730275805644 84.3756682284601, 134.12825054309639 138.08934313832907, -0.06414487964274951 292.20741875601766 M228.08933873127592 37.85791269317702 C174.17576326829908 98.64458735567112, 117.96093444022087 158.66235456898508, 1.708117576701687 298.73558599643053 M225.9335771745857 38.86899132905171 C153.24816946676785 124.08227394674267, 78.7917737779632 209.533970709232, -0.3282762007917688 299.7770279903479 M225.76860070521622 43.750103922745524 C147.05601588623713 132.58179855633648, 70.78429695479379 223.16924560862083, 0.038733815247264936 305.36990515930324 M226.06234119801528 43.669131707665564 C164.86784597199053 117.38330496930737, 99.85217164249862 191.69850462731821, 0.5391094497327722 305.4164582661938 M227.03685557846276 49.524046189104055 C173.1305450901808 109.20943789582473, 119.05421263772573 172.19285693577808, -0.7691342350213226 310.733582070934 M225.73310551927307 50.86449216938712 C173.7694829599136 112.90176027758015, 120.941091336561 175.495362786007, 0.6647256116183828 311.53076707155014 M225.92465996072679 57.853824067449246 C172.51494375492803 125.37494756002592, 115.75001314630477 189.9812439773134, -1.954138976636174 318.67128700841323 M225.84446622732347 56.335332178750825 C143.9907254286883 154.1961455319029, 59.66228134683407 250.39258118293824, -0.8009756263085137 317.14142847135827 M227.44834556831407 63.24460621030667 C179.67822330375807 115.36963619243265, 134.254195744175 168.1110422979906, -0.7937927845798232 322.417090861077 M226.89639582505038 63.14578793454234 C156.1530924394176 140.99398345154856, 87.34493068110247 221.95739768857985, -0.8294266267599237 322.7426000884609 M225.4202104554312 69.51495179513225 C180.02373246180142 126.73652599814325, 132.17235001490928 180.35924481125306, -0.9136292139983455 328.3155361423689 M225.96019414032938 67.97000656285653 C179.4359950264833 124.67129618321425, 131.32945437041187 179.26230868918415, -0.6038008775993546 329.15644437149314 M226.78107942799346 73.73506017058486 C175.20834360524245 133.12066872312877, 124.41649295513056 195.0758638817627, 0.48364245022565644 337.29650866810164 M227.48913732561488 74.43518976722758 C178.14381541344187 133.0813496167985, 129.10011744650328 189.5963352045919, -0.7554290927237308 334.7594846765298 M224.8989337627433 82.83891476341532 C176.94540894787025 141.84196991002085, 124.71504911727588 200.7632135299158, 0.521380137170893 340.4490494612488 M226.96041615552969 80.75971876710284 C179.43272350701213 134.65524287891566, 134.5382741533173 186.75175851286613, -0.6037521819785088 340.8963698893769 M224.75567785411997 87.67958134920768 C167.91192357979855 155.40375019021158, 108.93615420862976 220.67430671285092, 0.45945032626348326 345.9666972950341 M227.13376340111188 86.39391301390162 C151.39393285632974 172.9852991833139, 80.10797131926653 257.3178725898637, 1.0968435834093317 345.78232036219947 M226.04430446013572 92.13334860261234 C166.86488959030578 164.94697730286097, 104.56152697914726 234.88835224149722, 7.598532026176511 348.1990839393798 M225.6883645871359 93.50319439149071 C181.6694685283813 145.4799796302546, 136.9836314100353 197.15531011852354, 6.1990299523614 346.07397726889525 M228.25993494725145 99.1055503650601 C167.21706572287812 166.65775595444177, 110.95832872064658 236.28051664782976, 13.389309180305666 346.72886683633885 M227.43349837172798 98.44406787787338 C157.1859224597975 178.6962167720964, 86.37991970981854 259.4716378432128, 11.976460160209129 345.9921266887073 M226.1186958673742 105.45778338747415 C181.51882896024884 153.9859942717463, 140.95992163090665 204.42155117659752, 15.104555537684467 346.03880941074055 M226.3354302060759 104.44131505540281 C153.09819487782875 188.65280647732897, 81.30030509049655 272.05316632050017, 16.5003514074222 346.9465048400178 M224.7741904176425 112.27214705173422 C159.67573169325587 186.08015822132128, 97.03953792075569 261.1051170307765, 24.066703770603485 347.59134453900515 M226.53594021884993 111.5049248306776 C178.08011173305786 165.76508137927758, 130.58868458486248 220.14899973158057, 21.406065796277534 347.12600358002555 M225.59804599966142 118.02047168919168 C149.69580953962446 208.84952905985313, 69.07729485181346 301.29033729595415, 28.429591568339983 345.18859825509327 M226.22113666052542 116.83214112075869 C178.37020782242334 175.3178263617972, 127.21718986120356 231.7607207970481, 27.498960266688535 347.39589206690357 M226.63411182027883 121.98454420599026 C176.88088378061158 181.96817643675237, 124.05917567311664 237.24292819618833, 32.398404806819485 345.0362436349661 M227.3746456032223 123.12430766845306 C169.4154475987435 186.722893169547, 111.59465748907051 252.65572128110045, 32.626073845750696 345.85808944984996 M224.68691548538007 128.1745672623583 C156.01179788590093 214.1053104768627, 86.98632836336643 296.340513233295, 36.32185456023236 347.84974452379095 M226.52490601706924 130.63566653276408 C160.66390530458688 208.3929561409346, 91.49155892779854 285.9817736411653, 38.16638302249772 346.9009817820574 M226.30202478562748 135.34913467276976 C175.5886043650863 195.27931447589222, 125.29039546692321 250.84185220646793, 43.39116188559674 344.92313344774163 M225.78987952314233 136.34395859094133 C185.16463367556662 182.89646395973799, 144.21201250765066 228.56599821122305, 42.98989570561127 346.13470725548234 M225.03360324848694 141.50992703228246 C181.07225118370891 196.3391077625741, 131.95051301354235 249.9769019854833, 48.50519659744021 345.6965905783081 M226.95107585466675 141.3734146985991 C171.18556640883037 206.46042861481413, 114.9076630883577 272.19228659526954, 49.278439875281904 347.63814064814386 M226.4782392308157 148.71855998586324 C177.53032016847226 204.35326522528388, 131.8745847252733 259.0335837747126, 52.285376352274085 346.35611628835255 M225.97702410124035 147.4047026167962 C175.99783156889893 208.0475557548245, 122.27652534632819 269.0080545914801, 54.80265020589674 346.57394750258317 M228.57644173816016 154.86349467963385 C188.96567031060695 202.2732414779438, 147.87645647171877 246.72597974135974, 60.53372000442303 348.65352474744907 M225.98153813459558 154.97005797622214 C173.93474667358333 217.64490304448407, 120.70473770638016 280.1012588464768, 59.91422338132764 346.5366485962071 M224.9777946332492 158.582235988049 C190.9333758809535 203.06029612784246, 157.1125991801765 242.27996053600248, 65.48217806441953 344.7694469292707 M225.70141879057752 160.99400736998592 C163.17980555102514 232.15782472291852, 102.50588944094007 305.0126835364851, 65.50716233649321 346.5679045766859 M225.26747226740576 167.9615039291075 C183.07072149892602 214.0642231189769, 138.8975625350575 265.98943684851747, 68.04686485594803 347.1850596903005 M225.95803487784656 165.714037154254 C190.14352207126376 207.34555013989512, 156.1037681203492 249.952968665083, 69.70490571174936 345.9915930553991 M225.79896273861422 172.31519133068971 C188.15625694766882 216.27356791618678, 150.65513597811187 255.89591199324275, 73.5448861011195 345.0599709597461 M227.27276090164148 171.4792190519838 C187.19460576101568 218.85078713884874, 144.12540279458065 267.18511264391145, 75.49523030176297 347.4335451641432 M226.13967631595924 176.74885005824686 C178.69366309194825 229.8897123295567, 132.63642542527734 284.819577750711, 81.8770798954494 345.50688425327394 M225.93612136243482 179.29603535555626 C176.66262849667518 236.8604143777057, 126.78867872352454 295.1973847233927, 79.90506487135349 346.4801117926031 M225.314972337933 185.16390699727015 C175.424714542253 242.5658460529576, 126.59259732772233 298.37116058849335, 85.19947819162523 345.4774380202944 M226.25182434354986 183.93733249040193 C194.51336133669435 220.31582853357438, 163.564909747672 257.2164686079473, 85.77742339176889 346.37639583782607 M226.9111427661162 190.0153027709181 C197.71451087334458 224.3290378286029, 166.02184905103582 260.4681313799415, 92.17348098708321 345.7295114751482 M227.11071934825472 191.70961571964912 C176.92294301621374 250.1284582458714, 125.04711782469204 308.9530743652385, 91.06710714829728 346.62930046644186 M225.5285524560136 195.73494802616702 C199.05195466646944 230.62798956534695, 171.0869554931473 260.6253967882334, 96.59535097057774 348.38281544843 M227.37142790135 196.11512376189992 C181.4664833192112 248.2324883002593, 136.4960408957841 299.40208791102805, 96.69586865456499 347.15119520869507 M227.82268626452708 204.80757244266317 C179.30000267077662 259.23616777962525, 131.7900391060429 315.3195926642148, 99.94621041490556 347.29474834237215 M227.18346863720168 202.48174115786102 C187.3836440283458 247.64967040383664, 149.1886664978096 292.641626586462, 101.14307058769771 346.6423973462703 M225.80229527348757 207.57094927178022 C192.87246082965643 249.86926843155805, 157.97308684603934 288.96878632881464, 106.78125445627612 345.53260133590004 M226.88170188174442 208.08689179255515 C190.69543864467153 248.0396636852382, 157.59820192164557 286.6634891881854, 106.61766037022173 347.15454165411876 M228.23671217748267 213.5826123337646 C188.26859251443358 262.97640999697603, 143.70636339393658 310.40809965964877, 112.66211802986822 347.4805672481324 M225.95027432489087 214.92918538984898 C196.69355868198846 250.59511336145533, 166.51437882275877 284.27176124527335, 111.45440318982202 347.59181112899523 M228.07824956954107 222.95953158010644 C190.69053891405127 262.67233638898165, 157.7269313238413 298.24091890123736, 116.42339127295867 345.88017712456883 M226.5975815293506 222.19756907015716 C198.9704273386766 252.55439339135953, 171.7795059159326 285.3427156412049, 117.98863740704049 347.2475513741208 M226.51604602267722 228.04785769050102 C196.4175024516632 260.0204872360142, 167.50852397433 295.6148547089149, 123.85242540263044 347.38949281170426 M226.31189707315377 227.70725945199624 C196.55812107731975 262.6774805669373, 166.62497484902147 297.76524074637797, 123.6905602321237 346.94054070248035 M225.14490932839584 233.30004682677634 C201.85969073944543 263.71835515332015, 176.25920086847748 293.1175593634874, 128.38462917692559 348.4610805617696 M226.47260866218568 233.35295063020885 C194.44677867036998 268.40882546870165, 163.50032992415802 303.3069550895897, 127.89503664254616 346.54283843155156 M226.79278209830514 238.3878907575667 C205.79585340048692 264.21862808011804, 180.20801503712065 292.14508823444464, 133.20827850236594 344.89166595602114 M227.64523883204438 240.5107137190367 C203.25457766298834 263.68179589961915, 182.52659178408717 288.9514442386651, 133.96465233144167 347.639963725527 M226.4747526064684 246.5926228314887 C195.27398357958896 276.68373453119847, 166.28631291449287 310.1455502124516, 137.22667889203086 346.78472785893194 M227.1209899379196 244.63792218641046 C208.1580623783185 266.4004676634614, 190.14148551725444 285.87721718463206, 137.96329265131178 347.6036570044574 M227.71132000550085 251.58038955210773 C204.57431342509614 275.5776831961443, 181.93015671135046 302.33605088528066, 143.4023468403039 348.57630828550975 M226.77794230763467 252.50731245468972 C210.026552014556 271.53922069515085, 193.12557909919107 291.5867117991878, 144.19443069886898 346.0503825136521 M226.42623770870063 257.3818937466333 C207.94074960918476 276.1117135624573, 192.8126909505671 297.43618293703065, 149.7691004400442 344.79985327800034 M226.58587326060226 257.33764368910164 C209.594450656165 277.7896193828804, 190.28692510869485 299.003171109327, 150.3823630093069 346.38620667854525 M224.7055158423014 262.0424412289043 C206.44434613049125 287.23543765469077, 185.84117472357693 310.4943298378981, 154.64591946835978 346.0159824129605 M226.02535928594838 264.5300120424512 C200.62627523796834 294.7227417504784, 173.07178818709403 324.32461526155487, 154.82395078197356 346.823690468012 M228.22753576261834 268.7391073519103 C203.39100420329805 295.68837699469856, 181.66647617804938 321.108151248903, 159.9319085903287 347.19015556005144 M227.27522789076212 269.8383257362804 C211.99508437027595 287.07647362621, 196.56813471039382 304.17399442289184, 160.66525765731174 346.80304242554047 M226.64774392662613 274.2147989021659 C202.32141507433695 300.0144781213936, 180.30046066975672 328.7151789139047, 166.47120523742507 346.73244237187987 M227.45467389553076 276.5714447923783 C205.6023644407994 301.134884980003, 183.07590835981208 326.1812662787643, 166.10284903473652 346.0470431262123 M225.74359369827508 282.7661043351099 C208.24038442829126 303.18927347896425, 188.7715589449747 325.7014684713653, 171.96159025578615 347.1383458740331 M226.3051428717842 281.423619351747 C208.56178750206766 304.5936562665487, 189.05722418087515 326.4417096187694, 171.02484515026953 347.06953977147595 M226.40182047344766 286.9301737936301 C215.79970898308207 300.48108355910796, 206.99667449258962 313.6982272810057, 175.01277597972907 346.4245786000109 M227.63643513841177 289.2950887729449 C213.6061457993763 303.8341146864483, 198.46073939213323 321.22264823018764, 176.92968111761417 346.9527010448114 M228.66206701952237 294.49717906218194 C215.1309294911967 306.32366430817046, 201.81074667511538 320.02265016994625, 181.00845245683365 348.4307993196578 M226.04221981034212 294.45571531111455 C211.7931651909223 311.2260362439223, 194.73294613785595 329.8151234260933, 180.65478154168096 346.2144227206773 M226.79269600753537 300.09803323436626 C215.62480406230512 312.71082985028556, 206.1741609523359 324.2293533485822, 185.80393931063531 348.5208842155344 M225.90302209599264 300.91148888983 C212.45414592929725 316.7168687157863, 197.37524538097156 335.2516993585641, 185.73280545725166 346.6592983139623 M226.62030284831974 306.55441525365745 C214.724824178883 322.84268559539817, 199.0589073219015 336.29843530787184, 190.76598987327532 348.25170886533147 M226.0190765665165 306.5081438953917 C213.11319536003523 321.9320718461011, 199.62596612207116 338.51717549555633, 192.62128670311108 345.7289107227783 M225.28121179178785 312.00775777819393 C217.09449088008142 322.41495964818176, 206.82190716624714 332.56385146739694, 197.1007402700765 347.0643313938916 M227.529929566043 312.9796931897764 C220.1706700071985 319.58517379949706, 213.10055543981576 327.12195071397906, 197.82931143350376 346.1289996870548 M227.92120537409423 318.084475624961 C220.3233401061579 324.91501940945045, 217.2995050543269 330.9007479862266, 203.02404428349988 346.4969200548268 M226.59839977557579 318.5756953988355 C220.71953725351096 325.03987453503, 216.1849421570664 329.7822360701178, 203.21851581909993 346.28058924324523 M224.9544746286389 325.1768727197844 C222.06145841742085 331.9362158765269, 214.95014971637983 337.2810474210868, 209.6096856152369 346.79374803195606 M226.55027828508094 324.0166749417174 C222.32474059836076 328.8167501282734, 218.45269608108688 333.99325512977714, 207.49347344482132 347.0997284803356 M224.76525725541464 332.29578808516226 C225.0069716235294 334.607763677686, 219.27167111986776 338.8325891867054, 212.43926326243897 345.5088604143905 M226.5950714031926 330.60178309150604 C223.9867875693586 334.39289352604555, 219.75739248810712 338.8584434359934, 212.0401545317464 346.01291726595593 M227.57376272109533 336.7025162321662 C224.34157402371966 341.01556306995417, 220.75796126163846 344.4139816229515, 219.4802218095259 347.8642019859325 M227.2169416871758 336.5508916763422 C223.16354367787366 340.4166790999459, 220.74768723320102 344.2214629325705, 218.23759377111173 346.67851906702657 M226.75192080747155 343.3776634606216 C225.40193901391208 344.6467870099722, 224.88761060767447 345.314718209167, 223.2830141465558 346.3448226209094 M226.56604428636842 343.40612635167645 C225.86413448598216 344.21916965960025, 225.39307194770237 344.9494269766708, 223.5847630743129 346.57928950952515">
            </path>
        </pattern>
        <pattern id="rough-4946260528907523" x="0" y="0" width="1" height="1" viewBox="0 0 7 10"
            patternUnits="objectBoundingBox">
            <path
                d="M3.618627766118145 0.13218050431211015 C2.4933068814106774 0.877198826822504, 2.4025221841139572 1.3202115689036171, 0.3718876459931626 4.093243820824951 M3.2963932396581064 -0.22852468541882048 C2.0917433468716777 1.6089051307662252, 0.9091400064335474 3.026091917386378, -0.21683003620326904 4.165623014171327 M6.263210771403072 2.778907499639577 C4.671534716404377 3.573881200398703, 3.584382083612935 6.098694781199214, 0.35824891689425165 10.015971096414948 M6.887917130120716 2.3367853198626167 C4.9188661441608845 4.211963535473096, 2.5226222818246953 7.294737633107236, -0.0759984539833197 9.859515061295015 M7.188430906995813 8.357162950991071 C6.701449798186614 8.794700640435844, 5.961661473402519 9.450869304463117, 5.186741660518014 9.934973401695034 M7.059078032594801 8.28333603652672 C6.624082442885466 8.676384219275276, 5.997096719870327 9.29757717898029, 5.302922804413446 9.98623504905307"
                style="stroke: rgb(0, 0, 0); stroke-width: 0.5; fill: none;"></path>
        </pattern>
    </defs>
    <svg x="80%">
        <g id="graph0" class="graph" transform="translate(0, 240) scale(.9 .9) rotate(0)">
            <title>G</title>
            <!-- 5 -->
            <g id="node1" class="node">
                <title>5</title>
                <g>
                    <path class="node-fill"
                        d="M51.770854147579385 -250.31545549046808 C46.5853731933068 -244.81632647127148, 44.69525941913379 -242.02865458610668, 33.61538304339963 -232.78910116689363 M49.64584137910164 -248.9177900016009 C46.75916722075811 -246.27340247974342, 44.53409437568517 -242.35367463483243, 35.69859682079857 -232.72705235657637 M55.213559274209004 -250.37478485066114 C51.48511402599156 -247.51489150240673, 46.1560905647535 -239.05878397343025, 38.239041596993424 -228.5905258790031 M56.90644236994618 -251.61797559903707 C49.884894344945096 -243.41332525902857, 44.85405288943296 -236.97859713813082, 35.89030180138892 -228.45496190349462 M63.36787196959194 -251.5928977749015 C56.34376151095425 -244.44059285088466, 50.434035002117355 -238.60350988904335, 37.92018668162978 -226.24142285079435 M61.697908404561915 -251.16358390877497 C53.61941645412914 -242.81846991138428, 45.81588479931192 -232.0475852682864, 39.922515931432706 -224.92081352335512 M69.31557091993294 -252.78038835597397 C58.659371957040136 -243.29261719814184, 50.640194714278465 -235.03383275291992, 43.15201263851878 -224.21012680560733 M68.10800884343737 -251.28799302803245 C62.692427815064605 -244.23512744783136, 56.83401448062677 -237.22563721482553, 42.66372360627717 -223.09830794946845 M71.6448960067842 -249.66628155972646 C63.712142552766046 -239.22887619273126, 54.049383633563956 -230.00686256618917, 46.347280568084116 -219.34797583984545 M72.50496599307786 -250.8180764798907 C65.25799737699937 -242.67606126414628, 58.67024318891209 -233.93871478392822, 44.90478035647597 -220.2551370352832 M78.21229129167016 -251.33252901814953 C64.99736034174893 -238.50346675263907, 54.633893110214125 -224.51930064718513, 47.74008066201075 -220.05186070611322 M77.27998192768973 -250.37676891093085 C68.2235829824941 -239.77910038883712, 60.39246468730822 -231.39204663488098, 50.2549197362424 -219.10708214224334 M80.78195636020479 -248.6662348779705 C72.28618579572115 -235.52342684329147, 60.92938926998732 -226.27011618517335, 55.040463283006645 -219.30844402417603 M79.67123269041737 -248.62616166985407 C75.24217147436087 -241.0356640619786, 69.60079579919294 -235.2310983260363, 54.79519192257304 -217.76396860757458 M85.7986923873972 -244.8795502653184 C74.53189070205819 -234.02746911679017, 64.79930057414128 -225.4636738339065, 56.824334676286945 -217.2772362063924 M84.5206948440739 -245.35987470580852 C76.10602229505884 -238.3795982030803, 70.0304895032439 -229.2302426734417, 58.95696022348764 -216.30582882938037 M87.74495283046325 -242.10105170000767 C79.53248315870844 -237.4676693317821, 75.63025436932293 -230.9578567981201, 65.21160985379464 -215.92892938179375 M86.09359813859744 -243.84667366455315 C82.71159549093365 -236.15190232647103, 77.48143500836208 -230.5812834901092, 63.45157284026017 -216.46927481923382 M90.78415993053113 -238.94525724021247 C84.49929698019743 -233.15258221574427, 75.98010462901406 -223.58695298609666, 70.82081589483523 -215.760001481569 M90.03656646554745 -239.71146055766118 C81.72545247363418 -231.55471301282637, 73.43855839405839 -222.106738450516, 68.82252903632369 -217.42136744559065 M92.15893680860546 -236.61691617684596 C87.14279668289853 -230.50615496440125, 84.14088147395361 -225.72428743015234, 77.17875382179317 -217.0300519827266 M91.28743766303883 -236.25452773439778 C86.24863624888685 -228.4120227317192, 81.00242249055154 -224.03317916083031, 75.36339625003282 -217.95329334559105">
                    </path>
                    <path class="node-outline"
                        d="M63.20825065736395 -253.6056670827046 C68.53452002656701 -253.668910464892, 76.03393860677701 -251.1320939655227, 80.30347540051531 -248.28180134976037 C84.57301219425361 -245.43150873399804, 88.04726686880886 -240.3771902515348, 88.82547141979373 -236.50391138813058 C89.6036759707786 -232.63063252472634, 87.7118583329146 -228.54303658128498, 84.97270270642449 -225.04212816933494 C82.23354707993437 -221.5412197573849, 77.47581995355976 -217.01797774801668, 72.39053766085301 -215.49846091643045 C67.30525536814626 -213.97894408484422, 59.814995632563736 -214.3295865132913, 54.46100895018398 -215.92502717981756 C49.107022267804226 -217.52046784634382, 42.9849772132265 -221.45462527518973, 40.26661756657447 -225.071104915588 C37.548257919922435 -228.68758455598626, 37.207025300218305 -233.66690862905878, 38.150851070271806 -237.6239050222072 C39.094676840325306 -241.5809014153556, 41.25773488716685 -246.14627735556073, 45.929572186895456 -248.81308327447854 C50.601409486624064 -251.47988919339636, 62.252801307002166 -253.07979134076584, 66.18187486864345 -253.6247405357141 C70.11094843028474 -254.16968973066236, 69.49871226811067 -252.44949275851917, 69.50401355674315 -252.0827784441681 M54.58825425885729 -252.06824092247905 C59.2126987842557 -253.5594078731253, 65.16519245636594 -252.03334669511116, 70.48846579242034 -250.81599456566505 C75.81173912847474 -249.59864243621894, 83.79817770056368 -248.22112230517723, 86.52789427518368 -244.76412814580243 C89.25761084980368 -241.30713398642763, 88.16470890090774 -234.0533725966597, 86.86676524014031 -230.07402960941633 C85.56882157937288 -226.09468662217296, 82.5592803974282 -223.3298103066635, 78.7402323105791 -220.8880702223422 C74.92118422373001 -218.44633013802093, 69.1365890034074 -215.51088679645858, 63.95247671904574 -215.42358910348858 C58.76836443468409 -215.33629141051858, 52.10327251983293 -218.02611770365388, 47.63555860440918 -220.36428406452222 C43.167844688985426 -222.70245042539057, 38.44993080655871 -225.73774246155992, 37.146193226503215 -229.45258726869872 C35.84245564644772 -233.16743207583752, 37.162346256752045 -239.15103911071202, 39.813133124076195 -242.6533529073551 C42.463919991400346 -246.15566670399818, 50.386945057396986 -248.9548685254745, 53.05091443044813 -250.46647004855723 C55.714883803499276 -251.97807157163996, 55.35630999184195 -251.859843778919, 55.79694936238308 -251.72296204585155">
                    </path>
                </g>
                <text text-anchor="middle" x="63" y="-229.8" font-family="Handlee" font-size="14.00"
                    fill="#000000">5</text>
            </g>
            <!-- 10 -->
            <g id="node2" class="node">
                <title>10</title>
                <g>
                    <path class="node-fill"
                        d="M14.07903414816434 -177.87880343049764 C11.493358958554214 -172.1417653213588, 6.516339893288966 -164.88347385183624, -0.9643849016434043 -160.4613240270661 M15.632980636507678 -177.1428447695762 C10.026917981329062 -171.3579174568827, 5.18716853762694 -164.75654234070151, 1.1835595815632969 -160.44132283909488 M23.096781728323286 -180.86013438264268 C13.738798337033064 -170.49925745961826, 7.011206876680416 -161.43608588444488, 2.9263269374697636 -158.0273309505681 M21.72680586695991 -178.7867966774278 C14.968937346320502 -171.01587367198846, 7.766242009719184 -161.2338563789119, 2.244102583268721 -155.33495508206983 M29.631159418097695 -178.67434737819315 C21.180087866205636 -171.75300673700133, 13.706470295502182 -160.49249813249514, 3.579152200099604 -151.69169068894257 M28.493252976965923 -179.09225931976096 C20.535269972425617 -171.6922719863811, 13.73634969076517 -162.05768550735402, 4.6428329475700245 -153.03887164862928 M33.14941138799723 -179.45355576469112 C24.643031134438463 -168.89936529348847, 15.681324615578465 -158.0213559127009, 6.275873507269157 -150.86636296729566 M32.90312856840591 -178.82894965457058 C24.8729210500197 -169.32801755048695, 14.875729142641493 -159.33694981030695, 7.807955039039845 -149.29097028693528 M38.08156652938323 -177.5626327603381 C28.756057665561297 -168.4208547831012, 22.691611749050892 -161.505999365315, 11.00272184632837 -147.51698914255465 M37.821990541274744 -178.73150157190494 C31.261108346681752 -171.54293760398792, 26.45622468816325 -164.66272783082525, 11.7953696964298 -148.36556552916124 M42.93704526948996 -176.40509184457218 C33.61053088048514 -167.64075732050026, 24.119699643742585 -157.5809110103609, 14.70143380827173 -148.36956382818303 M40.40167477535975 -175.51044097102005 C31.98642340570101 -166.33254788223445, 21.522753033396434 -155.20374657822424, 15.361051331870902 -147.19208968524472 M46.79105796415097 -173.15080852921022 C38.92188079016367 -165.27920237004903, 33.20591194943277 -157.3953558466271, 18.370689727076623 -143.97246310258143 M44.43708382303418 -173.7080297194269 C38.29663337591501 -167.05849560162528, 32.84452532597599 -160.38031146145843, 19.850561502869734 -144.93021069739686 M49.52010251071699 -173.36570278063814 C43.15450970961226 -166.78240687012487, 37.782224046921684 -159.9252443366058, 22.51337686822057 -146.2678859440548 M48.51711150432982 -172.86321640821632 C42.55616349053482 -164.0384525599745, 36.355540140818896 -158.38573202015527, 23.425436393857176 -144.50558683954878 M48.91468096542815 -167.66289347320952 C45.018966572727756 -159.58174011995789, 37.75685686088472 -153.22981898935393, 29.81138861670484 -146.65075302946613 M50.67964905146743 -168.3761100371835 C43.95581383723007 -161.90891389384714, 39.481876209484696 -155.1942266089514, 30.444406667050387 -144.73918138311413 M52.87694258753783 -166.33681362751435 C47.685114811749436 -159.07767900685639, 41.20312912355782 -148.91046193209004, 36.91710334649347 -143.99153428056496 M51.92541466721608 -165.97263895942837 C45.99680395146394 -158.40244364800358, 40.62810321018391 -151.6687716515276, 36.307592465818196 -146.2073646760792 M53.07924768474305 -159.94355982253583 C49.5321385431016 -154.95638229316836, 46.53519609924882 -151.1031330745533, 43.5354490398349 -147.56332316795314 M52.24688709255186 -159.4408843760168 C50.06110049786389 -155.8368534905206, 46.01026347473123 -151.73518290755766, 44.087789521203085 -149.01880393368805">
                    </path>
                    <path class="node-outline"
                        d="M29.00412244861318 -180.4384165962009 C34.33453312398653 -180.30723003347205, 41.426105514338175 -178.4566961000504, 45.476938102143166 -175.79584831187947 C49.527770689948156 -173.13500052370853, 52.99198826208438 -168.43073860942647, 53.30911797544313 -164.4733298671753 C53.62624768880188 -160.51592112492412, 50.661223171246924 -155.58157061607173, 47.379716382295705 -152.05139585837244 C44.098209593344485 -148.52122110067316, 38.8761039856385 -144.4721539951287, 33.62007724173582 -143.29228132097964 C28.36405049783314 -142.11240864683057, 20.74261940511578 -143.10912213675357, 15.843555918879614 -144.97215981347802 C10.94449243264345 -146.83519749020246, 6.465207436402167 -150.89685007808225, 4.225696324318836 -154.47050738132629 C1.986185212235505 -158.04416468457032, 1.1537203994375302 -162.72863271329, 2.4064892463796284 -166.41410363294224 C3.6592580933217267 -170.09957455259448, 6.685008004528531 -174.1437749139655, 11.742309405971424 -176.58333289923968 C16.799610807414318 -179.02289088451386, 28.675081236169664 -180.574240917923, 32.75029765503699 -181.05145154458737 C36.825514073904316 -181.52866217125174, 36.263881621762856 -179.71865299048716, 36.19360791917538 -179.44659665922595 M29.14441617839204 -181.59925176931284 C34.24463053387238 -181.2488688458506, 41.31896448948826 -177.66195442669408, 45.37859039959122 -174.6114989329712 C49.43821630969418 -171.5610434392483, 52.872681558563016 -167.03764325165952, 53.50217163900981 -163.29651880697548 C54.1316617194566 -159.55539436229145, 52.29209528202045 -155.60776002814967, 49.155530882271975 -152.1647522648669 C46.0189664825235 -148.72174450158414, 40.17300170899833 -143.718818832593, 34.68278524051896 -142.63847222727884 C29.192568772039596 -141.55812562196468, 21.195178023912753 -143.6896655113268, 16.21423207139579 -145.68267263298202 C11.233286118878828 -147.67567975463723, 7.257633765656591 -150.85054642089167, 4.797109525417181 -154.59651495721008 C2.336585285177771 -158.34248349352848, 0.18010525993909154 -164.23956781256373, 1.4510866299593346 -168.15848385089237 C2.7220679999795774 -172.077399889221, 8.049419361321013 -176.08053817948783, 12.42299774553864 -178.11001118718193 C16.796576129756268 -180.13948419487602, 24.922299275190834 -180.07608769070941, 27.692556935265095 -180.33532189705696 C30.462814595339356 -180.5945561034045, 28.61766660991504 -179.9727665653326, 29.0445437059842 -179.66541642526715">
                    </path>
                </g>
                <text text-anchor="middle" x="27" y="-157.8" font-family="Handlee" font-size="14.00"
                    fill="#000000">10</text>

                <!-- 10 LEFT CHILD (null) -->
                <text id="10-L" class="null hidden" text-anchor="middle" x="15" y="-122.8"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>
                <!-- 10 RIGHT CHILD (null) -->
                <text id="10-R" class="null hidden" text-anchor="middle" x="50" y="-122.8"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>
            </g>
            <!-- 5&#45;&gt;10 -->
            <g id="edge1" class="edge">
                <title>5-&gt;10</title>
                <g>
                    <path
                        d="M54.2854,-216.5708C50.0403,-208.0807 44.8464,-197.6929 40.1337,-188.2674"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-5641711627558583&quot;);">
                    </path>
                    <path
                        d="M54.89102743950759 -214.77941777317494 M54.89102743950759 -214.77941777317494 C50.58048389513789 -209.59661852407396, 45.43492629691943 -197.9709915100395, 39.78014062003919 -188.59360480488954 M54.4645574861045 -214.68677805978135 C47.7270960039428 -208.0759005019023, 46.07059131689908 -197.79021455335706, 37.79557900925441 -187.30895836274917"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
                <g>
                    <path
                        d="M43.237,-186.6477 L35.6343,-179.2687 L36.976,-189.7782 L43.237,-186.6477"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-7116142215517475&quot;);">
                    </path>
                    <path
                        d="M42.428447892742874 -186.36738479130472 C41.22649497371263 -184.83101724813727, 37.54693654625402 -181.35882980153733, 35.139027648102285 -178.5122835024476 M42.96620339542542 -186.29393817511328 C40.72242222468873 -184.2117151259305, 37.76215934908238 -180.8430159154607, 35.49563434495184 -178.7464356008326 M35.72728282348546 -179.83172037851486 C35.75004407478608 -183.14752084436708, 35.719499820756866 -186.73174261194035, 35.95506349477292 -189.63051884289644 M35.85199130442952 -179.26189521239795 C36.44639997671599 -183.05899508645078, 36.8544968546707 -187.6009778020382, 36.87359044123929 -189.96214526475887 M37.40195162066611 -189.3236279542813 C38.12267757426286 -189.028393335031, 40.72144016400471 -187.3073492427959, 42.69303299132291 -185.96375019307118 M36.9978980171131 -189.50087606141085 C39.64284022600514 -188.3376933324519, 41.74149587994721 -187.1412030632272, 43.263294374184696 -186.37737049553593 M43.237 -186.6477 C43.237 -186.6477, 43.237 -186.6477, 43.237 -186.6477 M43.237 -186.6477 C43.237 -186.6477, 43.237 -186.6477, 43.237 -186.6477"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
            </g>
            <!-- 12 -->
            <g id="node3" class="node">
                <title>12</title>
                <g>
                    <path class="node-fill"
                        d="M87.50590342597626 -176.7164208885748 C83.8319384951474 -169.8415928226872, 76.25457371963441 -164.0392512476484, 71.74259754028293 -160.40517293040915 M89.00798511633963 -178.21688783435974 C83.96811454867466 -172.5058332484671, 79.54256952563196 -168.19331924847458, 72.65967785493258 -160.42140009084991 M95.45651179269154 -177.30937917185204 C89.31664468727436 -170.25164279752383, 81.32883966639295 -163.73365398392065, 73.39274701517762 -156.2728266129751 M95.31895775710447 -179.8610708368727 C88.88081654209451 -173.85137884029197, 84.64618228091426 -165.9990977794736, 74.03064815378096 -156.5232841808439 M99.043129413239 -179.79329272733338 C93.8460416114012 -171.2494454010782, 81.45632397547274 -160.10082340580195, 77.7933837325638 -153.43168475120189 M99.67828280094365 -180.0466728865371 C92.21519445950206 -171.9204387573645, 87.05348833773117 -164.85568655154836, 77.06741651862029 -152.46307658817196 M103.61873459349349 -178.63729358473122 C96.37247773755944 -169.1021406185339, 87.19309345227381 -162.10654401917438, 78.22342474940622 -149.01319583954336 M104.27354078390576 -178.4881190165951 C98.24321857538807 -171.31882566990976, 91.27277350185464 -163.42611388408108, 79.20929248053186 -150.42733086173516 M111.14925878814343 -176.19386405857225 C105.02587478595657 -170.90477631209382, 97.55724934356344 -165.47155916631777, 82.79620922954963 -149.8351479299053 M109.0746475806891 -177.7110707645055 C101.49564269080578 -169.42261168403454, 93.03371043987019 -160.8500494107302, 82.3898699725854 -148.08061037968523 M114.58312443993624 -175.0759776530575 C106.45742717012149 -168.50607817553887, 97.54390879737299 -157.95537109674046, 87.91999834729702 -144.94835437958076 M114.30023802074582 -177.48467786061897 C108.05776510029933 -168.89945475446223, 102.85660022632587 -163.36470907479188, 87.30038460896493 -146.39585778352063 M117.63237778192584 -174.26693234242768 C110.3829843088025 -165.88691186813998, 106.12248322049653 -160.515402961982, 92.86321476171031 -146.5800936334607 M117.06928064841763 -173.82455825929242 C108.28711429084684 -163.21582769703033, 99.40114124598115 -153.81985347788498, 91.58415187074613 -145.24814128637627 M120.32614518030088 -170.0934555581993 C111.19836856525323 -164.06652029970388, 104.77524547159487 -153.2624920690615, 97.49862890494737 -146.0851055002814 M119.76749807695273 -171.85834505590984 C114.01034892256438 -164.3961269117745, 107.97299600995215 -157.38630616688636, 96.14813993455012 -144.5485062248514 M123.50933342846102 -168.3179219209913 C119.35497528175192 -161.86745964012397, 112.3576779833534 -159.55346909287866, 103.0613278406718 -143.68026326142808 M123.1429794241641 -169.07060227577713 C115.69787997257002 -160.6661191445304, 108.79905443810665 -153.03597855125307, 101.4868176758955 -144.10360059761186 M125.75950817141164 -165.4728106139819 C119.11907065418309 -159.11133942647663, 114.26409797174492 -153.6778910130513, 109.59038315131394 -143.87881364523034 M125.12474787328756 -164.39469294732223 C118.90903459551004 -156.6381093559303, 111.87449519383209 -149.60007291491544, 108.5956688401303 -145.74790749152288 M123.74876036708679 -158.0106167197797 C122.31666353953803 -156.41988392223146, 121.18687699689471 -154.07971793367406, 114.76626789720804 -147.87973470209755 M124.16827541678693 -158.44695375946318 C121.67680958198295 -155.6887201035886, 119.24533811262349 -152.4432343748492, 115.11873892236544 -149.26420868270776">
                    </path>
                    <path class="node-outline"
                        d="M102.92594858788675 -180.0742078858857 C108.55094174041866 -179.8076352605705, 116.01963014869712 -177.2172201642388, 119.72477993738767 -174.27034774139804 C123.42992972607821 -171.32347531855729, 125.09830612273164 -166.497295495539, 125.15684732003007 -162.3929733488411 C125.21538851732849 -158.28865120214323, 123.71999548964288 -152.71120231252848, 120.07602712117819 -149.64441486121072 C116.43205875271349 -146.57762740989295, 109.03693312757781 -144.52012576495585, 103.29303710924188 -143.99224864093458 C97.54914109090595 -143.4643715169133, 90.40102477278623 -144.46864506383446, 85.61265101116263 -146.47715211708314 C80.82427724953902 -148.48565917033181, 76.53234008303448 -152.38180391478, 74.5627945395003 -156.0432909604266 C72.59324899596612 -159.70477800607318, 72.05822186344558 -164.673439738878, 73.79537774995757 -168.44607439096276 C75.53253363646955 -172.21870904304754, 79.5621153894943 -176.6550950913716, 84.98572985857224 -178.67909887293527 C90.40934432765019 -180.70310265449893, 102.33620665923998 -180.48967172016503, 106.33706456442526 -180.59009708034466 C110.33792246961055 -180.6905224405243, 109.03439273853809 -179.73058569155654, 108.99087728968397 -179.281651034013 M94.58644745550323 -180.74292188460342 C99.50831884061803 -181.98917630089477, 106.65129874078684 -181.00359168546876, 111.29229869308267 -179.24387815524906 C115.9332986453785 -177.48416462502936, 120.1772063881465 -174.1399663868053, 122.43244716927822 -170.1846407032852 C124.68768795040994 -166.2293150197651, 126.35895108991024 -159.65012713036612, 124.82374337987298 -155.5119240541284 C123.28853566983572 -151.37372097789068, 118.35050579245255 -147.54111430235082, 113.22120090905472 -145.3554222458589 C108.09189602565688 -143.169730189367, 99.70925967423469 -141.44871930325738, 94.04791407948596 -142.39777171517696 C88.38656848473724 -143.34682412709654, 82.91949989354204 -147.69103158335102, 79.25312734056241 -151.04973671737642 C75.58675478758279 -154.40844185140182, 71.97063502256567 -158.6989747905387, 72.04967876160819 -162.55000251932935 C72.12872250065071 -166.40103024812, 75.8994998286586 -171.35327765087078, 79.72738977481754 -174.15590309012032 C83.55527972097647 -176.95852852936986, 92.44701542129926 -178.4992021341712, 95.01701843856175 -179.36575515482662 C97.58702145582424 -180.23230817548202, 95.49111242097209 -179.61647512958862, 95.14740787839253 -179.3552212140528">
                    </path>
                </g>
                <text text-anchor="middle" x="99" y="-157.8" font-family="Handlee" font-size="14.00"
                    fill="#000000">12</text>
            </g>
            <!-- 5&#45;&gt;12 -->
            <g id="edge2" class="edge">
                <title>5-&gt;12</title>
                <g>
                    <path
                        d="M71.7146,-216.5708C75.9597,-208.0807 81.1536,-197.6929 85.8663,-188.2674"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-5694296840607001&quot;);">
                    </path>
                    <path
                        d="M71.9078763551623 -217.59258150580584 M71.9078763551623 -217.59258150580584 C74.78264226406749 -208.94480832983874, 79.32110977678111 -198.18793987588523, 84.73370995436042 -190.25189895922773 M73.12115591408518 -219.42535678704957 C76.98517726064385 -207.35890622680031, 79.5265214890999 -196.5040196723584, 88.29349604473954 -190.4258183547097"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
                <g>
                    <path
                        d="M89.024,-189.7782 L90.3657,-179.2687 L82.763,-186.6477 L89.024,-189.7782"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-6643234192878235&quot;);">
                    </path>
                    <path
                        d="M88.0093392518475 -188.87275088225365 C90.07046340745619 -186.93355322161494, 90.62722927718275 -183.5956005711099, 89.43031887065744 -179.45809025806682 M88.82550013755312 -189.4372881729489 C89.38116408293139 -185.4285829997316, 90.00082758521664 -181.12946242760418, 90.2111160704095 -178.9028102242327 M89.4684063872024 -179.1933003222416 C87.41939367671402 -182.57760721609037, 86.07317141832071 -184.7537750826317, 82.89922631512984 -187.26580266754982 M90.61951463593316 -179.53479534261191 C88.36401441497998 -181.74016651066484, 85.29163986466523 -183.23741333867343, 83.2170875778301 -186.6807296408157 M82.66463389645662 -186.1615131162767 C85.62554975529926 -188.36534808231715, 87.14757554674087 -189.63914041006916, 89.17939175030337 -189.66232649670903 M82.56550429189501 -186.6551726398954 C84.5452543787328 -187.22654686820206, 86.07899458582317 -188.54151789504323, 89.16375499107647 -189.86995318382228 M89.024 -189.7782 C89.024 -189.7782, 89.024 -189.7782, 89.024 -189.7782 M89.024 -189.7782 C89.024 -189.7782, 89.024 -189.7782, 89.024 -189.7782"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
            </g>
            <!-- 6 -->
            <g id="node4" class="node">
                <title>6</title>
                <g>
                    <path class="node-fill"
                        d="M52.25005775504472 -106.01697784707639 C46.29065822576738 -103.76203593483889, 42.56533885387915 -99.52515852066486, 36.18163032054376 -88.14264068353967 M50.39141020313238 -105.04159488670084 C46.18959979340897 -102.2488134698574, 42.23820456853913 -97.65691520776834, 36.81965189949097 -89.40166873870984 M56.53046314608638 -108.51447147359228 C52.01005578101367 -101.59949269699413, 46.84835777823054 -94.9780007115138, 35.54922477345297 -82.25085358853778 M57.85525855005995 -108.50956766565425 C52.73956440877783 -102.59161124488647, 49.03179244870215 -96.88825907623684, 36.92524620425128 -83.49837253828707 M64.41153069076782 -109.81998470115742 C55.17357693575488 -97.96231637781881, 46.65886639369377 -90.82766472493032, 40.44251368337044 -79.22578207520566 M63.45614404524156 -108.87952226550763 C52.91738768540912 -96.50507500028208, 43.8254615522559 -85.61536787503593, 38.87078404397709 -80.24937799768362 M69.4123065878206 -109.43859160475998 C62.244872808830316 -100.10703702422612, 56.674272431168234 -93.16003489904296, 41.69027640611769 -76.30504050477566 M67.25254441165572 -106.96474357309468 C62.83069436224946 -101.32845838946572, 56.28143255377509 -93.79755510094637, 43.6366986419044 -77.27976906207444 M72.07416565197735 -107.21184928732491 C62.795028701624325 -94.89569647157533, 52.18053893634935 -84.94849848386048, 46.02705068515294 -76.66831418718789 M73.18341671096456 -107.51314232805912 C65.37193133226853 -98.65517044099641, 59.15021858966059 -90.5847316012069, 46.792884587608235 -75.65452642574294 M77.29023885454286 -104.37444783787117 C66.99279227281014 -95.22790294522058, 60.35184736859487 -85.25742164670157, 48.17079946641012 -74.94812596152809 M77.31540987245312 -104.63883097514683 C71.05915890579246 -97.58504915363977, 64.54190198209388 -91.23450568618172, 50.2404548335143 -74.95058246747112 M80.84817876861182 -102.4599029694212 C73.24997510531685 -91.89349913371694, 62.630083486876586 -83.52997254157606, 53.487724336629114 -71.99062833123646 M81.19646063133433 -102.91472108225798 C72.92920164475659 -95.25320768974201, 66.35588562732973 -89.03774826300575, 54.77981009727238 -72.32087404708538 M82.76653991051538 -101.42043089460748 C72.12877071506462 -89.86810605126294, 62.326125138110704 -79.08225204863693, 59.2467847727853 -72.20908352239344 M84.89818271078033 -101.69323312919106 C75.81975172221085 -91.07220649828962, 67.65994261065423 -81.72393346812994, 59.2340579883171 -71.49040884478065 M88.02744790395143 -99.26567681245393 C78.3182943137304 -88.96459754658598, 72.381056399136 -78.17442153043571, 64.72072239021577 -70.89219734327413 M86.48492695857628 -97.75475798438856 C79.0512307045632 -90.13652793155963, 72.86149161201978 -80.908902072092, 63.53253813311089 -71.628129670698 M88.42183254977118 -96.17278867720901 C85.7799893494838 -90.7531629702223, 78.10351329377717 -82.52344136085931, 69.68249936162401 -73.25983607489758 M89.5046133637086 -95.90298001287842 C82.54989068499741 -87.97793530975173, 78.61684311080232 -81.90333514302907, 69.11832891675374 -71.78852171923741 M89.65002687967065 -89.25562323359138 C86.32229837030009 -86.2678732563715, 83.15848838624959 -80.72931668684231, 76.42406913520132 -74.16745010665002 M90.47404031747858 -90.93386691838812 C87.30277808326288 -86.05491620739716, 84.28733449164704 -82.88535350464322, 77.0948342771144 -74.3542512248683">
                    </path>
                    <path class="node-outline"
                        d="M52.42383147404675 -105.419682317189 C56.97048118887352 -107.10990187826752, 65.03291751624937 -108.4767199348871, 70.41994790529755 -107.29411000468724 C75.80697829434573 -106.11150007448738, 81.72399165488848 -101.4721791660566, 84.74601380833577 -98.32402273598981 C87.76803596178307 -95.17586630592302, 89.28018074845312 -91.89332449612645, 88.55208082598134 -88.40517142428654 C87.82398090350955 -84.91701835244662, 84.32252302786597 -80.1013916487642, 80.37741427350502 -77.39510430495032 C76.43230551914408 -74.68881696113644, 70.48832492717547 -72.20354125661359, 64.88142829981562 -72.1674473614032 C59.27453167245578 -72.13135346619282, 51.155136435277726 -74.77187820709057, 46.73603450934597 -77.17854093368798 C42.316932583414214 -79.5852036602854, 39.395415608299025 -83.2680846123826, 38.36681674422507 -86.60742372098768 C37.33821788015111 -89.94676282959277, 37.75962494206552 -93.78863396399171, 40.56444132490222 -97.21457558531851 C43.36925770773892 -100.64051720664531, 52.60504932422585 -105.79841680763543, 55.19571504124524 -107.16307344894848 C57.786380758264634 -108.52773009026153, 56.12887232238309 -105.68710615958659, 56.10843562701855 -105.40251543319681 M67.58017827872237 -106.80103610510184 C72.71630164496835 -106.46443054568456, 77.74025574867603 -103.11094377026406, 81.116556061485 -100.60317102858713 C84.49285637429396 -98.0953982869102, 87.3370207840941 -95.15886997400115, 87.83798015557613 -91.75439965504029 C88.33893952705817 -88.34992933607943, 87.22262101286793 -83.55420442010869, 84.12231229037721 -80.17634911482199 C81.02200356788649 -76.79849380953529, 74.76219497961509 -72.6300937965577, 69.23612782063181 -71.48726782332007 C63.710060661648534 -70.34444185008243, 55.796941439309755 -71.3119800834563, 50.96590933647755 -73.3193932753962 C46.13487723364535 -75.32680646733608, 42.38515831844552 -79.88870500223075, 40.249935203638586 -83.53174697495939 C38.11471208883165 -87.17478894768803, 36.85047063375354 -91.4168592270785, 38.15457064763595 -95.17764511176802 C39.45867066151836 -98.93843099645753, 43.38187850191143 -104.2110967362753, 48.07453528693304 -106.09646228309641 C52.76719207195465 -107.98182782991753, 62.988131645230446 -106.5154923324231, 66.3105113577656 -106.48983839269476 C69.63289107030076 -106.46418445296644, 67.75770329051346 -106.31771120779254, 68.00881356214398 -105.94253864472645">
                    </path>
                </g>
                <text text-anchor="middle" x="63" y="-85.8" font-family="Handlee" font-size="14.00"
                    fill="#000000">6</text>
                <text id="6-R" class="null hidden" text-anchor="middle" x="83" y="-50.8"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>
            </g>
            <!-- 12&#45;&gt;6 -->
            <g id="edge3" class="edge">
                <title>12-&gt;6</title>
                <g>
                    <path
                        d="M90.2854,-144.5708C86.0403,-136.0807 80.8464,-125.6929 76.1337,-116.2674"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-278072312222209&quot;);">
                    </path>
                    <path
                        d="M89.54832399014312 -146.16440252299603 M89.54832399014312 -146.16440252299603 C85.25128476150148 -137.09507960977757, 79.15473119374558 -124.1558479368392, 77.75184340458914 -115.40240724207757 M88.34761930149575 -145.42334775323283 C85.77209625603957 -136.69002739493507, 83.09719410175026 -123.48007614074301, 78.26823080740812 -117.08593802268898"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
                <g>
                    <path
                        d="M79.237,-114.6477 L71.6343,-107.2687 L72.976,-117.7782 L79.237,-114.6477"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-8478495387468595&quot;);">
                    </path>
                    <path
                        d="M79.90680947589004 -113.94373321940142 C77.10999570617786 -112.52510984424269, 74.82469586726299 -111.2141197376777, 71.25218614258789 -106.59410680379038 M79.35136149779376 -114.1831529734174 C77.01709998553254 -111.81651916569643, 74.32617491286044 -109.87898429478318, 71.64352567136785 -106.84224164695364 M71.33848462850436 -106.25963310416981 C71.32768323877772 -110.2392095993068, 72.92457873104219 -113.30021857830481, 72.11274113437884 -117.48050016720565 M71.80276228009052 -107.43436426226937 C72.14835939068163 -110.71130318819995, 72.10154524619168 -115.25109872790195, 72.77487069766137 -118.169248916104 M72.67212180755861 -117.42882129178354 C75.72771077095862 -116.86096640969448, 77.72678950167631 -116.09011890513831, 79.16612290313995 -114.56629949937326 M73.13317498013583 -117.57771349742424 C75.28607903054548 -117.01224427994484, 77.28387625867501 -115.34406706094984, 79.23558023904711 -114.75890558382468 M79.237 -114.6477 C79.237 -114.6477, 79.237 -114.6477, 79.237 -114.6477 M79.237 -114.6477 C79.237 -114.6477, 79.237 -114.6477, 79.237 -114.6477"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
            </g>
            <!-- 8 -->
            <g id="node5" class="node">
                <title>8</title>
                <g>
                    <path class="node-fill"
                        d="M122.13680503788895 -105.57419247498153 C117.19825047081251 -99.92412910973273, 109.73315958783085 -93.91708138740263, 106.74477917087863 -88.12577794419646 M122.069620095849 -105.99632342053934 C118.51733306651563 -102.00710273691422, 113.95502432754138 -96.76714906773526, 107.19165050299789 -88.83970172812367 M126.9870721044983 -106.50554256343217 C122.50184530226824 -100.95350221906972, 115.96591566160271 -95.94307437776601, 106.99262293826041 -85.51331948336107 M128.01573002061474 -107.27354519564547 C123.5920929772865 -101.60588262999022, 117.85461450346475 -94.48994683056887, 108.17658902944848 -85.1488217066083 M136.08869577072934 -109.73106508836334 C124.49896161377791 -95.38370860880849, 114.83144899615014 -85.32163454183089, 109.03471322170031 -82.52356987988513 M133.54424294276637 -108.36725323861384 C124.35277924106852 -98.50032160186288, 116.34574148216562 -87.5308255033174, 111.16775178831429 -81.2421479918608 M138.9360177602791 -108.64552721013786 C131.09418873405318 -96.50853131784393, 121.28657665508007 -88.84000409155277, 111.88837763920708 -77.99288912954754 M139.23870311243132 -108.14643016931336 C133.6360177771187 -100.44962423657316, 125.16078523565682 -91.29963952572142, 114.271863506223 -78.9267394715034 M143.34213724103702 -106.25605620414392 C135.5378617243011 -96.09366968474883, 123.67050700716824 -82.88155374224499, 115.37810217307027 -74.6600927318439 M144.4606037272224 -107.04384508163348 C138.05171026301653 -99.30039196839034, 131.73890951418835 -94.48344928746124, 117.03230248915071 -76.6107515032063 M148.38514403328728 -107.54560360870599 C140.4427855541267 -94.26027487286835, 132.4481522304622 -85.52748764799802, 119.81974918012712 -75.09403449707803 M147.71317999217842 -106.44464903702647 C142.97647641830923 -98.39720214961255, 136.99179159959 -92.6443970770589, 120.94903440983512 -74.72868875074512 M153.7861932017121 -105.31939251468717 C144.43043851205664 -95.6140458594245, 134.18666366421314 -82.8111858875733, 124.15289564125858 -72.9266049088331 M151.69336930735696 -104.36224325702192 C145.1467904210649 -95.39027440887803, 136.99729738029976 -88.18260381582749, 125.25302758058116 -74.2654896866663 M154.28643707004056 -100.50765468385192 C146.26367576881765 -94.10974827274077, 139.4988650936633 -83.18868165239752, 131.6007275635616 -73.28743297709502 M155.08317227002155 -102.9775063697844 C147.29202846969915 -91.563586048921, 139.09245207052408 -81.64393633596494, 129.01951809892853 -73.0882425164015 M160.58099735709155 -98.98033350363669 C153.7136502571286 -90.95403218468117, 145.16210812776865 -84.30020517566456, 135.49697367752285 -72.65935738940652 M159.2665831483641 -100.59545950920196 C148.6812762972494 -88.14695735566981, 140.57278884655665 -78.13495037946598, 134.84016489015292 -72.31741970415597 M162.49862777817384 -95.6076540457375 C152.9123257245892 -85.41440412450147, 146.58113749723498 -75.55475617992728, 139.76208199214193 -73.30661969006997 M161.5161962279119 -97.34832672907486 C157.7972094710328 -92.23282289018444, 152.4694653876655 -86.99398177467769, 141.40396658991227 -72.66790320133981 M162.74353457811438 -94.20515547854848 C158.81747665170406 -88.22445869689676, 151.87734303413527 -83.51344925712225, 148.37787157416935 -72.50805094679684 M162.95408035585695 -91.76741620736418 C157.23704660592352 -84.76188628493216, 150.18093560219558 -77.52846297310556, 146.30253936469225 -73.30619780244892 M162.2230966156013 -85.29565174765064 C159.96994627545376 -84.02541905745622, 159.75087636185486 -81.19502191850556, 155.94420283899427 -77.99835189675893 M161.95276008915295 -85.79807420131422 C159.74211038364098 -82.70746318732289, 158.42292265298295 -80.31284082207391, 156.22321511407753 -78.294029213698">
                    </path>
                    <path class="node-outline"
                        d="M122.79902305368596 -106.06429959950053 C127.86059767875247 -107.86328188520626, 136.26132618749648 -107.71329425856328, 142.00898872401535 -106.91182666403705 C147.75665126053423 -106.11035906951082, 153.89829717216227 -104.33741197301447, 157.28499827279924 -101.25549403234314 C160.6716993734362 -98.1735760916718, 162.58122061682317 -92.40660648959164, 162.3291953278371 -88.42031902000905 C162.07717003885105 -84.43403155042645, 159.9195082731644 -80.02161374495995, 155.77284653888293 -77.33776921484757 C151.62618480460145 -74.65392468473519, 143.33274745791613 -72.49470996809649, 137.4492249221483 -72.31725183933477 C131.56570238638045 -72.13979371057306, 125.41440524556836 -74.10480492134215, 120.47171132427594 -76.27302044227731 C115.52901740298353 -78.44123596321248, 109.44950397530138 -82.02662002537517, 107.79306139439382 -85.32654496494571 C106.13661881348625 -88.62646990451626, 107.24841152788485 -92.35080222100335, 110.53305583883056 -96.07257007970063 C113.81770014977627 -99.7943379383979, 123.89609588786847 -105.89115367122305, 127.5009272600681 -107.6571521171294 C131.10575863226774 -109.42315056303575, 132.2136614947043 -107.2247652405053, 132.16204407202835 -106.66856075513874 M134.873139431535 -108.0710765137801 C140.351151248338 -108.28138050685662, 148.86713390023226 -105.3508059096336, 153.63479357390258 -102.90416039070186 C158.4024532475729 -100.45751487177012, 162.88053553316897 -96.88690782755609, 163.47909747355703 -93.39120340018964 C164.0776594139451 -89.89549897282319, 160.48990444127327 -85.30944177231007, 157.22616521623098 -81.92993382650316 C153.9624259911887 -78.55042588069625, 149.33222744620798 -74.70258604390395, 143.89666212330326 -73.11415572534816 C138.46109680039854 -71.52572540679236, 130.03525119448364 -71.23224933597872, 124.61277327880266 -72.39935191516842 C119.19029536312169 -73.56645449435813, 113.99772654736398 -76.71986695510421, 111.36179462921746 -80.11677120048635 C108.72586271107093 -83.5136754458685, 107.94634607817348 -88.65883063492451, 108.79718176992347 -92.78077738746134 C109.64801746167346 -96.90272413999817, 112.0813744685446 -102.44949851466932, 116.46680877971741 -104.84845171570731 C120.85224309089023 -107.24740491674531, 132.01273835220215 -106.91070348532408, 135.1097876369604 -107.17449659368935 C138.20683692171863 -107.43828970205463, 134.81879632143725 -106.5784547574221, 135.0491044882669 -106.43121036589898">
                    </path>
                </g>
                <text text-anchor="middle" x="135" y="-85.8" font-family="Handlee" font-size="14.00"
                    fill="#000000">8</text>
                <!-- 8 LEFT CHILD (null) -->
                <text id="8-L" class="null hidden" text-anchor="middle" x="120" y="-50.8"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>
                <!-- 8 RIGHT CHILD (null) -->
                <text id="8-R" class="null hidden" text-anchor="middle" x="155" y="-50.8"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>
            </g>
            <!-- 12&#45;&gt;8 -->
            <g id="edge4" class="edge">
                <title>12-&gt;8</title>
                <g>
                    <path
                        d="M107.7146,-144.5708C111.9597,-136.0807 117.1536,-125.6929 121.8663,-116.2674"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-3160897311706635&quot;);">
                    </path>
                    <path
                        d="M109.62414837622539 -144.4071992203672 M109.62414837622539 -144.4071992203672 C112.21541622402441 -136.74102857310388, 115.6513015745444 -123.97842500927858, 119.91941129085345 -116.87115222515652 M111.41028405012555 -142.76068911378584 C109.93536055303606 -134.60326470165975, 115.23082080137237 -126.90943402312874, 120.23772897694846 -114.7211613139476"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
                <g>
                    <path
                        d="M125.024,-117.7782 L126.3657,-107.2687 L118.763,-114.6477 L125.024,-117.7782"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-3701170521658375&quot;);">
                    </path>
                    <path
                        d="M125.86160792272943 -118.02467961156782 C125.61782953099313 -113.81146208309801, 125.27571229111003 -109.54610836777739, 126.62805890048867 -106.56900525199171 M125.3918803479853 -118.1569255524542 C125.78589692250671 -114.82934467489984, 125.92314198613303 -111.63053630601176, 125.96046382095848 -106.92171955656259 M127.11463164984751 -107.73071513996307 C124.5711186436568 -108.13825778849883, 123.11406794779111 -110.1887667719063, 119.38273870532682 -113.68140455789526 M126.45493702779233 -107.0451123325071 C125.19545081980657 -108.65722302614373, 123.57731076193649 -109.8871107722963, 119.01005925066077 -114.34015866225711 M118.44246500404151 -114.42034397324021 C120.17523732222341 -115.44361364129091, 122.4042543938137 -116.13325658089295, 125.03997885939816 -117.62281960894335 M118.55018896429048 -114.78587615504726 C119.87277975868385 -115.03865427805006, 121.46311296343586 -115.75316985634745, 124.91670924151764 -117.82822918742359 M125.024 -117.7782 C125.024 -117.7782, 125.024 -117.7782, 125.024 -117.7782 M125.024 -117.7782 C125.024 -117.7782, 125.024 -117.7782, 125.024 -117.7782"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
            </g>
            <!-- 9 -->
            <g id="node6" class="node">
                <title>9</title>
                <g>
                    <path class="node-fill"
                        d="M50.53146388425365 -35.487148712210214 C48.64985781348711 -28.536334743889043, 43.766968506179325 -28.674495199863966, 36.077209473630184 -18.292859900477055 M52.507562907807554 -33.64428521024316 C48.718974854991835 -29.95304716740558, 43.58131617889411 -26.106855664441195, 36.455490021037185 -16.667113908159358 M57.48948745475313 -34.64094634186795 C55.43374298731521 -30.33643252302992, 49.40490367487394 -24.854172485406863, 39.72030885447774 -12.695845065245098 M57.89744591528242 -34.8394821934668 C50.49989348602057 -27.153299544260783, 43.404609223302266 -18.762564819308896, 38.155650651857826 -11.453095021641538 M64.61649148489909 -37.63929987215711 C57.83839791338141 -31.067843249705884, 51.72616670897619 -23.077342855216315, 41.623774582684256 -7.586076909770387 M63.09928674563826 -35.472343265875224 C57.673025843063286 -28.78929434384348, 53.52394751477189 -24.100252555547787, 39.77789347761936 -8.588384104707968 M69.31900464740488 -35.23159244923859 C58.79180636149795 -24.332688749783937, 50.21480281353994 -10.12647895878279, 43.089380738296725 -6.749851327676432 M67.78442664409425 -35.5028471309694 C63.57862043969869 -30.37950862375134, 57.358207468395584 -23.494755631340023, 43.55552696835117 -6.379285422646204 M73.63679495967233 -35.76242551637908 C63.47529314991869 -23.845132472941003, 56.630941877326954 -16.540446397330317, 48.42467629372305 -2.114052331160802 M73.4178416471808 -34.82411668720661 C65.71458716008812 -25.438499517703164, 56.5110430575276 -15.209901881018148, 46.513779028652905 -4.1514262539487365 M78.80633959423895 -34.126244787101584 C68.8121922152013 -24.29769564304819, 64.83740622655431 -15.732612733527045, 52.67592985549966 -0.9906623092390108 M77.41234369467688 -33.80069278921227 C69.57474715753051 -24.044507961061925, 60.629593027504896 -13.9970640954527, 50.03851949419224 -1.5169434921637723 M81.52380287956525 -31.45672524979494 C73.25936609531352 -18.80084438523024, 64.08243896956809 -11.740215918472622, 54.20848065639945 -1.154953250408651 M80.24423870404274 -30.023362019183057 C73.36092871428609 -22.996196613041878, 67.52543925145358 -14.871686579444475, 55.437351464570625 -0.7934616755831447 M83.81684806127664 -27.734075096890543 C78.69674084263862 -18.894631914373072, 69.92232770703765 -12.994568943896708, 58.03479927586043 -1.0419021558817265 M83.6812370385728 -29.032114842841406 C79.53663165662707 -23.61926907227149, 73.76215859559994 -17.59353161068982, 58.79961162205577 0.012277785469465563 M85.73275002426742 -23.662920118766632 C79.84273689669087 -15.11226698007426, 68.52071859516461 -6.018364800317886, 64.90800695024494 1.4665122884906556 M87.21900847549655 -26.538007476612925 C82.66086632778566 -19.50133581365471, 76.42988412589378 -13.72995057397266, 64.32839768198313 0.49630260461943987 M89.49201669531739 -22.621924044178627 C84.0676716174464 -14.804038580476078, 78.61036331520972 -7.80011314498868, 72.57042374212568 -1.9379293579774979 M89.22974061588937 -21.383837568599734 C81.65296153025267 -13.89837396752892, 75.56808549030181 -7.349039906338499, 71.4787061933145 -1.8679585617303553 M90.64556202783432 -15.564689537476498 C86.59529474932778 -12.145088350499162, 81.44016298277045 -9.126394411156095, 78.84992783471056 -4.806456631847441 M89.23070141364414 -15.527728148003517 C86.01448483716459 -12.17947339647557, 82.73212710007164 -7.47540028860713, 77.42837077363353 -3.7430381355061457">
                    </path>
                    <path class="node-outline"
                        d="M69.04592343059662 -35.75597103531982 C74.54546527893274 -35.20389752320252, 81.000910551881 -31.85212075772909, 84.74519893731738 -28.83838247883985 C88.48948732275376 -25.824644199950612, 91.53903373764439 -21.508202849055934, 91.51165374321485 -17.673541361984395 C91.48427374878531 -13.838879874912857, 88.5613526982288 -8.699053608528166, 84.58091897074019 -5.8304135564106225 C80.60048524325157 -2.961773504293079, 73.61269116563176 -0.9619157788329403, 67.62905137828311 -0.4617010492791316 C61.64541159093446 0.038513680274677164, 53.70430860280444 -0.799289053784102, 48.679080246648304 -2.82912517908777 C43.65385189049217 -4.858961304391437, 39.47090833501734 -8.869892421736889, 37.47768124134632 -12.640717801101138 C35.484454147675294 -16.411543180465387, 34.76827202809709 -21.993761403561837, 36.71971768462218 -25.454077455273264 C38.67116334114728 -28.91439350698469, 43.373778326791864 -31.751766171801417, 49.18635518049688 -33.402614111369694 C54.9989320342019 -35.053462050937966, 67.23737831618487 -35.370644216206884, 71.5951788068523 -35.359165092682915 C75.95297929751973 -35.347685969158945, 75.38156684850829 -33.486314720869395, 75.33315812450144 -33.333739370225864 M68.22707692286642 -36.75768464617243 C74.06389063760449 -35.95745327066078, 81.94172841006423 -31.904470315608876, 85.60389737176696 -28.55655526908249 C89.2660663334697 -25.208640222556106, 90.69301547466296 -20.30410802859244, 90.20009069308283 -16.670194367014123 C89.7071659115027 -13.036280705435804, 86.6613122713305 -9.442483870305372, 82.64634868228616 -6.753073299612575 C78.63138509324182 -4.063662728919779, 71.57432792456068 -1.5415503638272356, 66.11030915881679 -0.5337309428573462 C60.646290393072896 0.4740884781125432, 54.64156711226719 1.20506555171007, 49.86223608782281 -0.7061567737932393 C45.082905063378426 -2.6173790992965484, 39.73805721783711 -7.892206950705071, 37.434323012150486 -12.001064895877201 C35.13058880646386 -16.109922841049332, 34.03670863995493 -21.540807376350394, 36.03983085370308 -25.359304444826023 C38.04295306745123 -29.177801513301652, 44.01399289692232 -33.19260553018308, 49.45305629463938 -34.91204730673097 C54.892119692356445 -36.63148908327886, 65.59376071646786 -35.44709812960549, 68.67421124000546 -35.67595510411334 C71.75466176354307 -35.90481207862119, 68.26760681997018 -36.46033056233085, 67.93575943586502 -36.28518915377805">
                    </path>
                </g>
                <text text-anchor="middle" x="63" y="-13.8" font-family="Handlee" font-size="14.00"
                    fill="#000000">9</text>

                <!-- 9 LEFT CHILD (null) -->
                <text id="9-L" class="null hidden" text-anchor="middle" x="48" y="21.2"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>
                <!-- 9 RIGHT CHILD (null) -->
                <text id="9-R" class="null hidden" text-anchor="middle" x="83" y="21.2"
                    font-family="Handlee"
                    font-size="14.00" fill="#000000">None</text>

            </g>
            <!-- 6&#45;&gt;9 -->
            <g id="edge5" class="edge">
                <title>6-&gt;9</title>
                <g>
                    <path d="M63,-71.8314C63,-64.131 63,-54.9743 63,-46.4166"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-4560223390810273&quot;);">
                    </path>
                    <path
                        d="M61.51637318624802 -73.46955571055459 M61.51637318624802 -73.46955571055459 C63.65493200617941 -65.84434294998725, 61.50079422397311 -55.40205471733948, 63.04608187981047 -44.97239648592596 M61.57989683736549 -74.45461801081395 C63.0754462796672 -63.46163603490955, 62.609793605313364 -57.14900236377399, 61.004038848835755 -47.65783567416091"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
                <g>
                    <path d="M66.5001,-46.4132 L63,-36.4133 L59.5001,-46.4133 L66.5001,-46.4132"
                        style="stroke: none; stroke-width: 0; fill: url(&quot;#rough-4946260528907523&quot;);">
                    </path>
                    <path
                        d="M66.7565410676397 -47.0187846525833 C65.92966228851722 -42.14108039957975, 63.8676364882306 -38.77197513998986, 62.44690072624629 -36.37925883745909 M66.02599374907321 -46.63404801228048 C65.1546943762025 -43.35604560702298, 64.12639041538242 -39.12662631525394, 63.104326312213544 -36.03220117978417 M63.85002779102446 -36.33171733464902 C61.55773922949061 -39.83557371640941, 60.303209498969515 -44.71591194882651, 58.78963029828501 -47.01048080369319 M62.78049401244865 -36.73482988956808 C62.45385920789415 -39.673827100787236, 61.06969782513554 -41.81613222806801, 59.781434753052025 -46.79508009181539 M58.907054543269176 -46.83553402862877 C61.0827026416506 -46.22968076124123, 63.90006073739204 -46.75634829622986, 66.21090239486928 -45.85998007656992 M59.83050839658025 -46.281431525813105 C61.71509580573633 -46.60775594372111, 63.40764821705029 -46.42089461511256, 66.183382042713 -46.587663542490084 M66.5001 -46.4132 C66.5001 -46.4132, 66.5001 -46.4132, 66.5001 -46.4132 M66.5001 -46.4132 C66.5001 -46.4132, 66.5001 -46.4132, 66.5001 -46.4132"
                        style="stroke: rgb(0, 0, 0); stroke-width: 1; fill: none;"></path>
                </g>
            </g>
        </g>
    </svg>
</svg>`
};