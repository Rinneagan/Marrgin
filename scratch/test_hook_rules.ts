import ts from "typescript";
import fs from "fs";
import path from "path";

function getAllTsxFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsxFiles(fullPath));
    } else if (file.endsWith(".tsx")) {
      results.push(fullPath);
    }
  });
  return results;
}

interface HookViolation {
  file: string;
  component: string;
  line: number;
  hookName: string;
  reason: string;
}

function checkFunctionForHookOrder(
  funcNode: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction,
  sourceFile: ts.SourceFile,
  componentName: string,
  filePath: string
): HookViolation[] {
  const violations: HookViolation[] = [];
  let hasEncounteredTopLevelReturn = false;

  if (!funcNode.body || !ts.isBlock(funcNode.body)) return violations;

  for (const statement of funcNode.body.statements) {
    // Check if this statement is a top-level return or an `if (...) return` at component top level
    if (ts.isReturnStatement(statement)) {
      hasEncounteredTopLevelReturn = true;
    } else if (ts.isIfStatement(statement)) {
      // Check if the `thenStatement` contains a return
      if (ts.isReturnStatement(statement.thenStatement)) {
        hasEncounteredTopLevelReturn = true;
      } else if (ts.isBlock(statement.thenStatement)) {
        const hasReturn = statement.thenStatement.statements.some((s) => ts.isReturnStatement(s));
        if (hasReturn) {
          hasEncounteredTopLevelReturn = true;
        }
      }
    }

    // Check if this statement declares or calls a hook
    const checkStatementForHooks = (node: ts.Node) => {
      // Do not traverse into nested functions or callbacks
      if (
        node !== statement &&
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node))
      ) {
        return;
      }

      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        let callName = "";
        if (ts.isIdentifier(expr)) {
          callName = expr.text;
        } else if (ts.isPropertyAccessExpression(expr)) {
          callName = expr.name.text;
        }

        if (/^use[A-Z]/.test(callName)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          if (hasEncounteredTopLevelReturn) {
            violations.push({
              file: filePath,
              component: componentName,
              line: line + 1,
              hookName: callName,
              reason: `Hook '${callName}' is called after an early return statement in component '${componentName}'.`,
            });
          }
        }
      }

      ts.forEachChild(node, checkStatementForHooks);
    };

    checkStatementForHooks(statement);
  }

  return violations;
}

function auditFile(filePath: string): HookViolation[] {
  const code = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
  const violations: HookViolation[] = [];

  const visit = (node: ts.Node) => {
    // Component via function declaration: function Foo() { ... }
    if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
      violations.push(...checkFunctionForHookOrder(node, sourceFile, node.name.text, filePath));
    }

    // Component via variable: const Foo = () => { ... }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          /^[A-Z]/.test(decl.name.text) &&
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          violations.push(
            ...checkFunctionForHookOrder(decl.initializer, sourceFile, decl.name.text, filePath)
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}

function runAudit() {
  console.log("========================================================");
  console.log("AST-BASED REACT HOOK ORDER AUDIT (RULES OF HOOKS)");
  console.log("========================================================");

  const targets = [
    path.join(process.cwd(), "src", "app"),
    path.join(process.cwd(), "src", "components"),
  ];

  let allFiles: string[] = [];
  for (const t of targets) {
    allFiles = allFiles.concat(getAllTsxFiles(t));
  }

  console.log(`Auditing AST of ${allFiles.length} React components...`);

  let allViolations: HookViolation[] = [];
  for (const file of allFiles) {
    allViolations = allViolations.concat(auditFile(file));
  }

  if (allViolations.length === 0) {
    console.log("✓ PASS: Zero Hook-order violations found across all components.");
    console.log("========================================================");
    process.exit(0);
  } else {
    console.error(`✗ FAIL: Found ${allViolations.length} Hook-order violation(s):`);
    for (const v of allViolations) {
      console.error(`  - [${v.file}:${v.line}] ${v.reason}`);
    }
    console.log("========================================================");
    process.exit(1);
  }
}

runAudit();
