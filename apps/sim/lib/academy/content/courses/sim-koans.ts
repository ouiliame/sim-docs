import type { Course } from '@/lib/academy/types'

/**
 * Sim Koans — short puzzles that reveal how Sim's execution engine *actually* behaves.
 *
 * Each koan follows the same shape: a small scenario, a prediction, then the reveal.
 * Every "surprising truth" here is verified against the executor (references, paths,
 * control flow, failure) — these are the edge cases that trip up real builders.
 *
 * IDs must never change after a learner has started the course.
 * Lesson IDs are localStorage keys for completion tracking; the course ID lives on the certificate.
 */
export const simKoans: Course = {
  id: 'sim-koans',
  slug: 'sim-koans',
  title: 'Sim Koans',
  description:
    'Short puzzles that reveal how Sim really runs — references, paths, control flow, and failure. Predict what happens, then see why. Master the edge cases that separate a workflow that works from one that only looks like it should.',
  estimatedMinutes: 45,
  modules: [
    {
      id: 'sim-koans-m1',
      title: 'References & Data Flow',
      description:
        'The single most common source of confusion in Sim: what an edge actually does, and where data really comes from.',
      lessons: [
        {
          id: 'sim-koans-m1-l1',
          slug: 'the-edge-carries-nothing',
          title: 'Koan 1 — The Edge Carries Nothing',
          lessonType: 'quiz',
          description:
            "You draw a line from Block A to Block B. Surely B now has A's data? Predict before you reveal.",
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  "You connect Block A → Block B with an edge, but in B's prompt you never write a reference to A. When B runs, what does it receive from A?",
                options: [
                  "A's full output is injected into B automatically",
                  'Nothing — B gets no data from A unless B references it with <A.field>',
                  "Only A's content field, nothing else",
                  'B waits forever for A to send data',
                ],
                correctIndex: 1,
                explanation:
                  'An edge means "run B after A," not "pipe A\'s data into B." Data moves only when B explicitly references <A.field>. The edge sets order; the reference moves the value. Wiring two blocks does not, by itself, hand the second block the first\'s output.',
              },
              {
                type: 'true_false',
                question:
                  "Drawing an edge between two blocks is what makes one block's output available to the other.",
                correctAnswer: false,
                explanation:
                  "An output is remembered globally under its block's name the moment that block finishes. Any later block can read it by reference — edge or no edge. The edge only controls ordering, not access.",
              },
              {
                type: 'multiple_choice',
                question: 'Which is the right mental model for a connection in Sim?',
                options: [
                  'A pipe that carries data from source to target',
                  'A dependency arrow that means "run me after you finish"',
                  "A function call that passes the source's return value",
                  'A copy of the source block',
                ],
                correctIndex: 1,
                explanation:
                  'A connection is a dependency arrow — it establishes order and nothing more. Think "B runs after A," never "A hands B its data." Internally the engine just removes A from B\'s set of unfinished dependencies; it never copies a value across the edge.',
              },
            ],
          },
        },
        {
          id: 'sim-koans-m1-l2',
          slug: 'the-invisible-wire',
          title: 'Koan 2 — The Invisible Wire',
          lessonType: 'exercise',
          description:
            'If data does not travel along edges, how does one block read another it is not even connected to?',
          exerciseConfig: {
            instructions:
              "Build a fan-out: connect the Starter to BOTH an Agent block and a Function block, so the two run side by side. They are not connected to each other. Here is the koan: the Function can still read the Agent's output by writing <agent.content> in its code — because every output is remembered globally by the block's name, not handed across a wire. The edge decides *order*; the name grants *access*. Wire it up, then click Run to watch both branches execute.",
            availableBlocks: ['agent', 'function'],
            initialBlocks: [
              {
                id: 'starter-1',
                type: 'starter',
                position: { x: 100, y: 240 },
                locked: true,
              },
            ],
            validationRules: [
              {
                type: 'block_exists',
                blockType: 'agent',
                label: 'Add an Agent block to the canvas',
              },
              {
                type: 'block_exists',
                blockType: 'function',
                label: 'Add a Function block to the canvas',
              },
              {
                type: 'edge_exists',
                sourceType: 'starter',
                targetType: 'agent',
                label: 'Connect the Starter to the Agent',
              },
              {
                type: 'edge_exists',
                sourceType: 'starter',
                targetType: 'function',
                label: 'Connect the Starter to the Function (fan-out — same source, two targets)',
              },
            ],
            hints: [
              'Drag the Agent and Function blocks onto the canvas, above and below each other.',
              "Hover the Starter's right edge to reveal its output handle, then drag a connection to each block. One source can feed many targets.",
              'There is intentionally no edge between the Agent and the Function. A reference like <agent.content> would still resolve, because outputs are looked up by name, not by following wires.',
            ],
            mockOutputs: {
              starter: { response: { result: 'Workflow started' }, delay: 200 },
              agent: {
                response: {
                  content: 'The agent thought, and remembered its answer under its own name.',
                },
                delay: 1200,
              },
              function: {
                response: { result: 'Read <agent.content> with no wire between us.' },
                delay: 600,
              },
            },
          },
        },
        {
          id: 'sim-koans-m1-l3',
          slug: 'the-road-not-taken',
          title: 'Koan 3 — The Road Not Taken',
          lessonType: 'quiz',
          description:
            'A reference points at a block that never ran. Error? Blank? The literal text? Predict.',
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  'A Condition sends execution down its TRUE branch. Block B sits on the FALSE branch and never runs. A later block references <B.result>. What does that reference resolve to?',
                options: [
                  'The workflow errors with "B did not run"',
                  'The literal text "<B.result>"',
                  'null — an empty value, with no error',
                  'B is forced to run so the reference has something',
                ],
                correctIndex: 2,
                explanation:
                  'A reference to a block that didn\'t run resolves to null — not an error, and not the literal token. The engine returns an empty value and keeps going. This is why a blank reference almost always means "the block it points to never ran on this path," not "I typed it wrong."',
              },
              {
                type: 'true_false',
                question: "Blocks on a branch that wasn't taken still run, just with empty input.",
                correctAnswer: false,
                explanation:
                  'Untaken branches are fully skipped — those blocks never execute at all. The engine deactivates that path; the nodes never enter the queue. There is no "ran with empty input" state.',
              },
              {
                type: 'multiple_choice',
                question:
                  'Your downstream block keeps receiving an empty value from <classify.category>. What is the most likely cause?',
                options: [
                  'A typo in the field name',
                  'classify is on a path that did not run on this execution',
                  'The model was too slow and timed out',
                  'Sim cached an old, empty output',
                ],
                correctIndex: 1,
                explanation:
                  'Because skipped-block references resolve to null silently, "blank value" is the signature of a path problem, not a syntax problem. Before hunting for typos, check whether classify actually ran this time — open the logs and confirm it is on the branch that executed.',
              },
            ],
          },
        },
      ],
    },

    {
      id: 'sim-koans-m2',
      title: 'Control Flow',
      description:
        'How execution splits, rejoins, repeats, and scales — and the limits that bite when you least expect them.',
      lessons: [
        {
          id: 'sim-koans-m2-l1',
          slug: 'the-diamond',
          title: 'Koan 4 — The Diamond',
          lessonType: 'exercise',
          description:
            'Two branches split from one block and rejoin at another. How many times does the meeting point run?',
          exerciseConfig: {
            instructions:
              'Build a diamond. Connect the Starter to TWO Agent blocks (a fan-out — they run at the same time). Then connect BOTH Agents into a single Function block at the end. The koan: that Function runs exactly once, after both Agents finish — never twice, even though two edges point into it. A block becomes ready only when every block pointing at it has completed. Wire the diamond, then Run.',
            availableBlocks: ['agent', 'function'],
            initialBlocks: [
              {
                id: 'starter-1',
                type: 'starter',
                position: { x: 80, y: 260 },
                locked: true,
              },
            ],
            validationRules: [
              {
                type: 'block_exists',
                blockType: 'agent',
                count: 2,
                label: 'Add two Agent blocks (the two parallel branches)',
              },
              {
                type: 'block_exists',
                blockType: 'function',
                label: 'Add a Function block (the meeting point)',
              },
              {
                type: 'edge_exists',
                sourceType: 'starter',
                targetType: 'agent',
                label: 'Connect the Starter to an Agent',
              },
              {
                type: 'edge_exists',
                sourceType: 'agent',
                targetType: 'function',
                label: 'Connect an Agent into the Function (the branches rejoin here)',
              },
            ],
            hints: [
              'Place two Agent blocks side by side, and one Function block to their right.',
              'Connect the Starter to each Agent — one source can fan out to many targets, and they run concurrently.',
              'Connect both Agents into the same Function. It will wait for both before running, and run only once.',
            ],
            mockOutputs: {
              starter: { response: { result: 'Workflow started' }, delay: 200 },
              agent: {
                response: { content: 'Branch finished.' },
                delay: 1000,
              },
              function: {
                response: { result: 'Both branches arrived. Running once.' },
                delay: 700,
              },
            },
          },
        },
        {
          id: 'sim-koans-m2-l2',
          slug: 'two-roads-one-traveler',
          title: 'Koan 5 — Two Roads, One Traveler',
          lessonType: 'quiz',
          description: 'The rules of splitting and rejoining, made precise.',
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  'Block A connects to both B and C. When do B and C run relative to each other?',
                options: [
                  'B first, then C, in the order you drew the edges',
                  'Both start at the same time, once A finishes',
                  'C waits until B has finished',
                  'It is undefined — could be either',
                ],
                correctIndex: 1,
                explanation:
                  'Fan-out runs concurrently. The moment A finishes, every block A points to becomes ready and starts together. There is no implied ordering between sibling branches.',
              },
              {
                type: 'multiple_choice',
                question: 'B and C both connect into D. How many times does D run?',
                options: [
                  'Twice — once per incoming edge',
                  'Once, after both B and C have finished',
                  'Once, as soon as either B or C finishes',
                  'It errors because D has two inputs',
                ],
                correctIndex: 1,
                explanation:
                  'D runs exactly once, after all of its incoming edges are satisfied. A block tracks how many predecessors it is still waiting on; it becomes ready only when that count hits zero. Convergence is automatic — you never get duplicate runs from multiple inbound edges.',
              },
              {
                type: 'true_false',
                question:
                  'To run two blocks at the same time, you need a dedicated Parallel block.',
                correctAnswer: false,
                explanation:
                  'Plain fan-out — one source connected to two targets — already runs them concurrently. The Parallel block is a different tool: a subflow that repeats the same inner blocks once per item in a list. Fan-out is for distinct blocks; Parallel is for one set of blocks over many items.',
              },
            ],
          },
        },
        {
          id: 'sim-koans-m2-l3',
          slug: 'the-loops-true-name',
          title: 'Koan 6 — The Loop’s True Name',
          lessonType: 'quiz',
          description:
            'Inside a loop, what do you call the current item — and what stops a loop that never ends?',
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  'Inside a forEach Loop, which reference gives you the item for the current pass?',
                options: ['<loop.value>', '<loop.currentItem>', '<loop.each>', '<item>'],
                correctIndex: 1,
                explanation:
                  '<loop.currentItem> is the item for the current pass of a forEach loop. Its position is <loop.index> (zero-based), which is the same value as <loop.iteration>. These context references only exist for blocks placed inside the loop.',
              },
              {
                type: 'multiple_choice',
                question:
                  'You build a for / doWhile loop whose condition could, in principle, never become false. What stops it?',
                options: [
                  'Nothing — it can run forever and hang the workflow',
                  'A default cap of 1000 iterations',
                  'A default cap of 100 iterations',
                  'A default cap of 10 iterations',
                ],
                correctIndex: 1,
                explanation:
                  'Sim caps loop iterations at 1000 by default, a guard against runaway loops. A forEach loop instead stops naturally at the end of its list. If you need more than the cap, you raise it deliberately — it will not silently run forever.',
              },
              {
                type: 'true_false',
                question: 'A Loop runs each of its inner blocks once in total.',
                correctAnswer: false,
                explanation:
                  'A Loop is a subflow container: the blocks inside it run once per iteration. Five items means the inner blocks run five times, each pass seeing a different <loop.currentItem>.',
              },
            ],
          },
        },
        {
          id: 'sim-koans-m2-l4',
          slug: 'the-twentieth-branch',
          title: 'Koan 7 — The Twentieth Branch',
          lessonType: 'quiz',
          description: 'A Parallel block over a long list. How much of it actually runs at once?',
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  'You point a Parallel block at a list of 50 items. How many items get processed, and how?',
                options: [
                  'Only the first 20 — the rest are dropped',
                  'All 50, but at most 20 at a time',
                  'All 50, every one literally at the same instant',
                  'It errors because the list is over 20',
                ],
                correctIndex: 1,
                explanation:
                  'Every item is processed, but concurrency is capped at 20 branches at once. A 50-item list runs in batches — 20, then 20, then 10. Nothing is dropped; what is bounded is throughput, not the count. Plan for the cap when an item does heavy work.',
              },
              {
                type: 'true_false',
                question:
                  'Fan-out (A connects to B and C) and the Parallel block are two names for the same mechanism.',
                correctAnswer: false,
                explanation:
                  'They are different. Fan-out runs distinct blocks once each, concurrently. The Parallel block repeats the same inner blocks once per list item, up to 20 at a time. One is about branching; the other is about iteration at scale.',
              },
            ],
          },
        },
      ],
    },

    {
      id: 'sim-koans-m3',
      title: 'Agents & Failure',
      description:
        'Where an agent’s output really goes when you give it structure, and what a single failing block does to everything downstream.',
      lessons: [
        {
          id: 'sim-koans-m3-l1',
          slug: 'where-did-content-go',
          title: 'Koan 8 — Where Did Content Go?',
          lessonType: 'quiz',
          description:
            'You give an Agent a Response Format, then reach for <agent.content> as usual. It is empty. Why?',
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  'You set a Response Format on an Agent with fields { score, tier }. Downstream you reference <agent.content>. What is there?',
                options: [
                  'The JSON object { score, tier }',
                  'Nothing useful — the fields are flattened to <agent.score> and <agent.tier>, and content no longer holds them',
                  'A stringified copy of the JSON',
                  'An error, because content was replaced',
                ],
                correctIndex: 1,
                explanation:
                  'With a Response Format, the schema fields become top-level outputs on the block. You reference <agent.score> and <agent.tier> directly — not <agent.content> and not <agent.content.score>. The plain content slot is replaced by the structured fields. (If the model ever returns malformed JSON, the agent falls back to a plain content string instead of erroring.)',
              },
              {
                type: 'multiple_choice',
                question: 'How do you read a single field of a structured agent output downstream?',
                options: [
                  '<agent.content.tier>',
                  '<agent.tier>',
                  'Parse content with a Function block',
                  '<agent.responseFormat.tier>',
                ],
                correctIndex: 1,
                explanation:
                  'Each schema field is its own named output, so <agent.tier> works directly. There is no need to dig into content or parse anything — that is the entire point of giving the agent a Response Format.',
              },
              {
                type: 'true_false',
                question:
                  "Adding a Response Format changes an agent's output from one 'content' string into separate named fields.",
                correctAnswer: true,
                explanation:
                  'Exactly. Without a format you get a single content string. With one, you get the schema’s fields as individual, selectable outputs — which is what lets a later Condition branch on <agent.tier> or a block read <agent.score>.',
              },
            ],
          },
        },
        {
          id: 'sim-koans-m3-l2',
          slug: 'guard-the-path',
          title: 'Koan 9 — Guard the Path',
          lessonType: 'exercise',
          description:
            'Make a path that only runs when a condition holds — and watch the other path simply not happen.',
          exerciseConfig: {
            instructions:
              "Connect the Starter to a Condition block, then connect the Condition's TRUE branch (its top output handle) to an Agent. Leave the FALSE branch unconnected for now. The koan: when the condition is true, only the Agent on the true branch runs — the false branch is not run with empty input, it simply never executes. Anything you put on a skipped branch, and any reference to it, evaluates to null downstream. Wire it and Run.",
            availableBlocks: ['condition', 'agent'],
            initialBlocks: [
              {
                id: 'starter-1',
                type: 'starter',
                position: { x: 80, y: 240 },
                locked: true,
              },
            ],
            validationRules: [
              {
                type: 'block_exists',
                blockType: 'condition',
                label: 'Add a Condition block',
              },
              {
                type: 'block_exists',
                blockType: 'agent',
                label: 'Add an Agent block for the true branch',
              },
              {
                type: 'edge_exists',
                sourceType: 'starter',
                targetType: 'condition',
                label: 'Connect the Starter to the Condition',
              },
              {
                type: 'edge_exists',
                sourceType: 'condition',
                targetType: 'agent',
                sourceHandle: 'condition-if',
                label: 'Connect the Condition’s TRUE branch (top handle) to the Agent',
              },
            ],
            hints: [
              'The Condition block shows two output handles on its right: the top one is the true branch, the bottom one is the false branch.',
              'Connect Starter → Condition, then drag from the Condition’s TOP handle to the Agent.',
              'Click the Condition to set its expression. Try `true` to take the true path while you test the wiring — the unconnected false branch just does nothing.',
            ],
            mockOutputs: {
              starter: { response: { result: 'Workflow started' }, delay: 200 },
              condition: { response: { result: true }, delay: 400 },
              agent: {
                response: { content: 'True branch taken. The false branch never ran.' },
                delay: 1100,
              },
            },
          },
        },
        {
          id: 'sim-koans-m3-l3',
          slug: 'the-error-that-stops-everything',
          title: 'Koan 10 — The Error That Stops Everything',
          lessonType: 'quiz',
          description:
            'One block in the middle throws. Predict what happens to everything after it.',
          quizConfig: {
            passingScore: 67,
            questions: [
              {
                type: 'multiple_choice',
                question:
                  'A block in the middle of your workflow throws an error, and it has no error connection. What happens to the blocks after it?',
                options: [
                  'They run, receiving the error as their input',
                  'The whole workflow stops — nothing downstream runs',
                  'Only that block’s branch stops; unrelated branches keep going',
                  'Sim retries the block forever',
                ],
                correctIndex: 1,
                explanation:
                  'By default, an unhandled block error halts the entire run — downstream blocks do not execute. The engine sets an error flag and stops. A failure is loud and total unless you have explicitly planned for it.',
              },
              {
                type: 'multiple_choice',
                question: 'How do you let one block fail without killing the whole workflow?',
                options: [
                  'Wrap the block in a Condition',
                  "Connect the block's error handle to a fallback block",
                  'Set the block’s retries to infinite',
                  'You cannot — errors always stop everything',
                ],
                correctIndex: 1,
                explanation:
                  'Each block has an error handle (the red output). Connect it to a handler block and, on failure, execution routes down that error path instead of stopping the run. The failure message is available as <block.error>. Now only that block "fails," and the workflow continues.',
              },
              {
                type: 'true_false',
                question: 'An error in any block always stops the entire workflow.',
                correctAnswer: false,
                explanation:
                  'Only when there is no error connection. With an error edge routing the failure to a handler, the run continues down that path. "Always stops" is the default, not a law.',
              },
            ],
          },
        },
        {
          id: 'sim-koans-m3-l4',
          slug: 'koan-mastery',
          title: 'Koan 11 — Mastery',
          lessonType: 'quiz',
          description: 'Eleven koans, one test. Earn your certificate.',
          quizConfig: {
            passingScore: 80,
            questions: [
              {
                type: 'multiple_choice',
                question: 'In one sentence, what does a connection between two blocks actually do?',
                options: [
                  'Carries the source block’s data into the target',
                  'Sets execution order — "run the target after the source finishes"',
                  'Copies the source block and merges it with the target',
                  'Calls the target like a function with the source’s output',
                ],
                correctIndex: 1,
                explanation:
                  'Edges are order. Data is moved separately, by references. Hold these two apart and most of Sim stops being surprising.',
              },
              {
                type: 'multiple_choice',
                question:
                  'A reference <B.value> points at a block B that was skipped on this run. The result is:',
                options: [
                  'an error',
                  'the literal "<B.value>"',
                  'null, silently',
                  'the previous run’s value',
                ],
                correctIndex: 2,
                explanation:
                  'Skipped-block references resolve to null with no error — which is exactly why an unexpectedly blank value is a signal to check the path, not the spelling.',
              },
              {
                type: 'multi_select',
                question: 'Which statements about control flow are true? (select all that apply)',
                options: [
                  'A block fed by two incoming edges runs once, after both finish',
                  'Fan-out runs sibling branches concurrently',
                  'A Parallel block runs every item, at most 20 at a time',
                  'Blocks on an untaken branch run with empty input',
                ],
                correctIndices: [0, 1, 2],
                explanation:
                  'Convergence is once-after-all; fan-out is concurrent; Parallel caps at 20 concurrent but processes everything. The false one: untaken branches are skipped entirely, never run with empty input.',
              },
              {
                type: 'multiple_choice',
                question:
                  'You give an Agent a Response Format with a "tier" field. The correct downstream reference is:',
                options: [
                  '<agent.content.tier>',
                  '<agent.tier>',
                  '<agent.responseFormat.tier>',
                  '<agent.output.tier>',
                ],
                correctIndex: 1,
                explanation:
                  'Response Format fields flatten into top-level outputs. Reference <agent.tier> directly; content no longer holds the structured fields.',
              },
              {
                type: 'true_false',
                question:
                  'To keep a workflow running when one block might fail, connect that block’s error handle to a handler.',
                correctAnswer: true,
                explanation:
                  'Without an error connection, a failure halts the whole run. With one, the error is routed and execution continues — the difference between a brittle workflow and a resilient one.',
              },
            ],
          },
        },
      ],
    },
  ],
}
