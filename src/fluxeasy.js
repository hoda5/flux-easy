var assert = require("assert");
var recast = require('recast');
var types = recast.types;
var n = types.namedTypes;
var b = types.builders;

function transform_js(source, inputMapFile) {

    var src_ast = recast.parse(source);
    var result_ast = transform_ast(src_ast, inputMapFile);

    if (inputMapFile)
        return recast.print(result_ast);
    else
        return recast.print(result_ast).code;
}

function transform_ast(ast) {

    var FluxEasySpecifier;
    recast.visit(ast, {
        visitImportDeclaration: function (path) {
            var src = path.node.source;
            if (n.Literal.check(src) && src.value == 'flux-easy') {
                var specifiers = path.node.specifiers;
                assert.ok(specifiers.length == 1 &&
                    n.ImportDefaultSpecifier.check(specifiers[0]) &&
                    n.Identifier.check(specifiers[0].id),
                    'TODO: allow rename specifiers');
                path.replace();
                FluxEasySpecifier = specifiers[0].id.name;
                return false;
            }
            this.traverse(path);
        },
        visitClassDeclaration: function (path) {
            if (FluxEasySpecifier) {
                var clazz = path.node;
                var superClazz = clazz.superClass;
                if (n.MemberExpression.check(superClazz) &&
                    n.Identifier.check(superClazz.object) &&
                    n.Identifier.check(superClazz.property) &&
                    superClazz.object.name == FluxEasySpecifier) {
                    if (['Store', 'View'].indexOf(superClazz.property.name) >= 0) {
                        path.replace(transform(superClazz.property.name, clazz));
                        return false;
                    }
                }
            }
            this.traverse(path);
        }
    });
    // assert.ok(FluxEasySpecifier, "Insert import FluxEasy from 'flux-easy' at beginning of source");
    return ast;
}

module.exports = {
    transform_js: transform_js,
    transform_ast: transform_ast
};


function transform(clazzName, clazz) {

    var addRef = fnAddRef();
    var obj = b.objectExpression([
        b.property('init', b.identifier('add' + clazzName + 'Reference'), addRef.fn)

        // link.oj b.property('init', b.identifier('AddLoggedInlistenner'), fnDestroy),
        //b.property('init', b.identifier('RemoveLoggedInlistenner'), fnDestroy),
    ]);

    var state_type;
    var private_vars = b.variableDeclaration('var', [
            b.variableDeclarator(b.identifier('$references'), null),
        b.variableDeclarator(b.identifier('$state'), null),
        b.variableDeclarator(b.identifier('$instance'), null),
        b.variableDeclarator(b.identifier('$dispatchToken'), null),
    ]);

    store_class_body = [
        private_vars,
        b.returnStatement(obj),
        fnCreate(),
        fnDestroy()
    ];

    if (state_type) {
        store_class_body.unshift(state_type);
        private_vars.declarations[1].id.typeAnnotation = b.typeAnnotation(b.genericTypeAnnotation(state_type.id, null));
    }

    return b.functionDeclaration(clazz.id, [], b.blockStatement(store_class_body));


    //        function fnUnlink(fn) {
    //            return b.functionExpression(b.identifier('createLink'), [b.identifier('dispatcher')], b.blockStatement([
    //            b.ifStatement(b.unaryExpression('!', b.updateExpression('++', b.identifier('references'), false), true),
    //                        b.expressionStatement(b.updateExpression('--', b.identifier('references'), false)),
    //                        b.ifStatement(b.unaryExpression('!', b.identifier('references')),
    //                            b.expressionStatement(b.callExpression(b.identifier(fnCreate), [b.identifier('dispatcher')]))),
    //                        b.returnStatement(b.identifier('instance'));
    //                        ]));
    //            }

    function fnCreate() {
        var instance = createInstance();
        var body = [
          b.expressionStatement(b.assignmentExpression('=', b.identifier('$instance'), b.objectExpression(instance.get.concat(instance.set)))),
                    b.expressionStatement(b.assignmentExpression('=', b.identifier('$state'),
                b.callExpression(b.memberExpression(b.identifier('$instance'), b.identifier('getInitialState')), [])
            )),
                    b.expressionStatement(b.assignmentExpression('=', b.identifier('$references'), b.arrayExpression([])))];
        if (clazzName == 'Store') {
            instance.get.forEach(function (prop_method) {
                if (prop_method.key.name != 'getInitialState')
                    addRef.obj.properties.push(b.property(
                        'init', prop_method.key,
                        b.callExpression(b.memberExpression(b.memberExpression(b.identifier('$instance'), prop_method.key),
                            b.identifier('bind')), [b.identifier('$instance')])
                    ));
            });
            body.push(
                b.expressionStatement(
                    b.assignmentExpression('=', b.identifier('$dispatchToken'),
                        b.callExpression(b.memberExpression(b.identifier('dispatcher'), b.identifier('register')), [
                b.functionExpression(null, [b.identifier('payload')], b.blockStatement([
                    b.variableDeclaration('var', [b.variableDeclarator(b.identifier('fn'), b.memberExpression(b.identifier('$instance'), b.memberExpression(b.identifier('payload'), b.identifier('action')), true))]),
                    b.ifStatement(b.identifier('fn'),
                                    b.expressionStatement(b.callExpression(
                                        b.memberExpression(b.identifier('fn'), b.identifier('apply')), [b.identifier('$instance'), b.memberExpression(b.identifier('payload'), b.identifier('args'))])))
                                //b.expressionStatement(b.assignmentExpression('=', b.identifier('$instance_set'), b.objectExpression(instance.set)))
                                ]))]))));
            body.push(
                b.ifStatement(b.memberExpression(b.identifier('dispatcher'), b.identifier('emitter')),
                    b.expressionStatement(
                        b.assignmentExpression('=', b.identifier('$emitter'), b.memberExpression(b.identifier('dispatcher'), b.identifier('emmiter')))),
                    b.expressionStatement(
                        b.assignmentExpression('=', b.identifier('$emitter'),
                            b.functionExpression(null, [b.identifier('fn'), b.identifier('e')], b.blockStatement([
                        b.expressionStatement(b.callExpression(b.identifier('fn'), [b.identifier('e')]))
                    ])))))
            );
        }
        return b.functionDeclaration(b.identifier('create' + clazzName + 'Instance'), [b.identifier('dispatcher')], b.blockStatement(body));
    }

    function fnDestroy() {
        var body = [
            b.expressionStatement(b.unaryExpression('delete', b.identifier('$instance'))),
            b.expressionStatement(b.unaryExpression('delete', b.identifier('$state'))),
            b.expressionStatement(b.unaryExpression('delete', b.identifier('$references'))),
        ];
        if (clazzName === 'Store')
            body.unshift(
                b.expressionStatement(
                    b.callExpression(b.memberExpression(b.identifier('dispatcher'), b.identifier('unregister')), [
                b.identifier('$dispatchToken')])));
        body.push(
            b.expressionStatement(b.unaryExpression('delete', b.identifier('$dispatchToken'))),
            b.expressionStatement(b.unaryExpression('delete', b.identifier('$emitter')))
        );
        return b.functionDeclaration(b.identifier('destroy' + clazzName + 'Instance'), [b.identifier('dispatcher')],
            b.blockStatement(body));
    }

    function createInstance() {
        var initialStateObj, initialStateFn,
            _get = [],
            _set = [];

        clazz.body.body.forEach(function (member) {
            if (n.ClassProperty.check(member)) {
                defineInitialStateFn(_get);
                setInitialState(member.key, member.typeAnnotation, b.identifier('undefined'));
            } else {
                assert.ok(member.type == n.MethodDefinition);
                assert.ok(!member.static);
                if (member.key.name == 'constructor') {
                    defineInitialStateFn(_get, member.value.body.body);
                    processMethod(member.value.body.body);
                } else {
                    var state_was_changed = processMethod(member.value.body.body);
                    if (state_was_changed)
                        _set.push(b.property('init', member.key, member.value));
                    else
                        _get.push(b.property('init', member.key, member.value));
                }
            }
        });

        return {
            get: _get,
            set: _set
        };

        function setInitialState(identifier, typeAnnotation, value) {
            assert(n.Identifier.check(identifier));
            var def = true;
            for (var i = 0; i < initialStateObj.properties.length; i++) {
                var p = initialStateObj.properties[i];
                if (p.key.name == identifier.name) {
                    assert(n.Identifier.check(p.value) && p.value.name == 'undefined');
                    p.value = value;
                    def = false;
                    break;
                }
            }
            if (def)
                initialStateObj.properties.push(b.property('init', identifier, value));
            if (typeAnnotation) {
                if (state_type)
                    for (var i = 0; i < state_type.right.properties.length; i++) {
                        var p = state_type.right.properties[i];
                        if (p.key.name == identifier.name)
                            return;
                    }

                var p = b.objectTypeProperty(identifier,
                    typeAnnotation.typeAnnotation,
                    true
                );

                if (state_type)
                    state_type.right.properties.push(p);
                else
                    state_type = b.typeAlias(b.identifier('$StateType'), null, b.objectTypeAnnotation([p]));
            }
        }

        function defineInitialStateFn(res, body) {
            if (!initialStateFn) {
                initialStateObj = b.objectExpression([]);

                initialStateFn = b.functionExpression(b.identifier('getInitialState'), [],
                    b.blockStatement([
                    b.variableDeclaration('var', [
                       b.variableDeclarator(b.identifier('state'), initialStateObj)
                    ]),
                            b.returnStatement(b.identifier('state'))]));

                res.push(b.property('init', b.identifier('getInitialState'), initialStateFn));
            }

            if (body)
                body.forEach(function (stmt) {
                    if (n.ExpressionStatement.check(stmt) &&
                        n.AssignmentExpression.check(stmt.expression) &&
                        n.MemberExpression.check(stmt.expression.left) &&
                        n.ThisExpression.check(stmt.expression.left.object)
                    ) {
                        setInitialState(stmt.expression.left.property, null, stmt.expression.right);
                        return;
                    }
                    initialStateFn.body.body.splice(initialStateFn.body.body.length - 1, 0, stmt);
                });
        }

    }

    function processMethod(methodBody) {
        var state_was_changed = false;
        recast.visit(methodBody, {
            visitThisExpression: function (path) {

                var p = path.parentPath;
                var parent_node = p.node;
                var l = p;
                var last_node = parent_node;
                while (n.MemberExpression.check(parent_node)) {
                    l = p;
                    last_node = parent_node;
                    p = p.parentPath;
                    parent_node = p.node;
                }

                check_state_changing();

                if (n.CallExpression.check(parent_node)) {
                    if (last_node.property.name == 'emit')
                        processEmit();
                } else {
                    path.replace(b.identifier('$state'));
                }

                this.traverse(path);

                function check_state_changing() {
                    if (n.AssignmentExpression.check(parent_node) && parent_node.left == last_node)
                        state_was_changed = true;
                    if (n.UpdateExpression.check(parent_node) && parent_node.argument == last_node)
                        state_was_changed = true;
                    if (n.UnaryExpression.check(parent_node) && parent_node.operator === 'delete' && parent_node.argument == last_node)
                        state_was_changed = true;
                }

                function processEmit() {
                    var call_path = p;
                    var call_node = parent_node;
                    assert.ok(call_path.parentPath);
                    var stmt_node = call_path.parentPath.node;
                    assert.ok(n.ExpressionStatement.check(stmt_node));
                    assert.ok(call_node.arguments.length > 0);
                    assert.ok(n.Literal.check(call_node.arguments[0]));
                    assert.ok(typeof call_node.arguments[0].value === 'string');
                    var event_name = call_node.arguments[0].value;
                    var emit = b.expressionStatement(b.callExpression(
                        b.memberExpression(
                            b.memberExpression(b.identifier('$references'), b.identifier('on' + event_name)),
                            b.identifier('forEach')), [b.identifier('$emitter')]));
                    call_path.replace(emit);
                }

            }
        });
        //        if (state_was_changed) {
        //            methodBody.push(b.expressionStatement(b.callExpression(b.memberExpression(b.thisExpression(),
        //                b.identifier('emit')), [b.literal('change')])));
        //        }
        return state_was_changed;
    }

    function fnAddRef() {
        var refObj = b.objectExpression([
                  b.property('init', b.identifier('getState'), b.functionExpression(null, [], b.blockStatement(
                      [b.returnStatement(b.identifier('$state'))]))),
                  b.property('init', b.identifier('release' + clazzName + 'Reference'), fnReleaseRef())
              ]);
        var fn = b.functionExpression(b.identifier('add' + clazzName + 'Reference'), [b.identifier('dispatcher')], b.blockStatement([
              b.ifStatement(
                b.binaryExpression('==', b.memberExpression(b.identifier('$references'), b.identifier('length')), b.literal(0)),
                b.expressionStatement(b.callExpression(b.identifier('create' + clazzName + 'Instance'), [b.identifier('dispatcher')]))),
              b.variableDeclaration('var', [b.variableDeclarator(b.identifier('ref'),
                refObj
            )]),
            b.expressionStatement(b.callExpression(
                b.memberExpression(b.identifier('$references'), b.identifier('push')), [b.identifier('ref')])),
            b.returnStatement(b.identifier('ref'))
        ]));

        return {
            obj: refObj,
            fn: fn
        };
    }

    function fnReleaseRef(name) {
        return b.functionExpression(b.identifier('release' + clazzName + 'Reference'), [], b.blockStatement([
              b.ifStatement(
                b.logicalExpression('&&',
                    b.binaryExpression('==', b.memberExpression(b.identifier('$references'), b.identifier('length')), b.literal(1)),
                    b.binaryExpression('==', b.memberExpression(b.identifier('$references'), b.literal(0), true), b.identifier('ref'))),
                b.expressionStatement(b.callExpression(b.identifier('destroy' + clazzName + 'Instance'), [])),
                b.blockStatement([
                            b.variableDeclaration('var', [b.variableDeclarator(b.identifier('i'),
                        b.callExpression(b.memberExpression(b.identifier('$references'),
                            b.identifier('indexOf')), [b.identifier('ref')]))]),
                    b.expressionStatement(b.callExpression(b.memberExpression(b.identifier('$references'),
                        b.identifier('splice')), [b.identifier('i'), b.literal(1)]))]))
                        ]));
    }
}
