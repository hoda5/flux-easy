var fs = require('fs');
var assert = require("assert");
var recast = require('recast');
var types = recast.types;
var n = types.namedTypes;
var b = types.builders;


function transform_file(inputFile, outputFile, options) {
    var input = fs.readFileSync(inputFile, {
        encoding: 'utf-8'
    });
    var output = transform_string(inputFile, input, options);
    fs.writeFileSync(outputFile, output.code, {
        encoding: 'utf-8'
    });
    if (options.sourceFileName && options.sourceMapName)
        fs.writeFileSync(options.sourceMapName, output.map.mappings, {
            encoding: 'utf-8'
        });
}

function transform_string(inputFileName, sourceCode, options) {
    if (!options)
        options = {
            range: true
        };
    var source_ast = recast.parse(sourceCode, options);
    var result_ast = transform_ast(inputFileName, source_ast);

    return recast.print(result_ast, options);
}

function transform_ast(inputFileName, source_ast) {

    var FluxEasySpecifier;
    recast.visit(source_ast, {
        visitImportDeclaration: function (path) {
            var src = path.node.source;
            if (n.Literal.check(src) && src.value == 'flux-easy') {
                var specifiers = path.node.specifiers;
                if (!(specifiers.length == 1 &&
                        n.ImportDefaultSpecifier.check(specifiers[0]) &&
                        n.Identifier.check(specifiers[0].id)))
                    throwError(specifiers[0], 'TODO: allow rename specifiers');
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
    return source_ast;

    function transform(clazzName, clazz) {

        var addRef = fnAddRef();
        var obj = b.objectExpression([
        b.property('init', b.identifier('create' + clazzName + 'Reference'), addRef.fn)

        // link.oj b.property('init', b.identifier('AddLoggedInlistenner'), fnDestroy),
        //b.property('init', b.identifier('RemoveLoggedInlistenner'), fnDestroy),
    ]);

        var state_type, event_type;
        var private_vars = b.variableDeclaration('var', [
            b.variableDeclarator(b.identifier('$references'), null),
        b.variableDeclarator(b.identifier('$state'), null),
        b.variableDeclarator(b.identifier('$instance'), null),
        b.variableDeclarator(b.identifier('$dispatchToken'), null),
    ]);

        class_body = [
        private_vars,
        b.returnStatement(obj),
        fnCreate(),
        fnDestroy()
    ];

        if (event_type)
            class_body.unshift(event_type);

        if (state_type) {
            class_body.unshift(state_type);
            private_vars.declarations[1].id.typeAnnotation = b.typeAnnotation(b.genericTypeAnnotation(state_type.id, null));
        }

        return b.functionDeclaration(clazz.id, [], b.blockStatement(class_body));


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
                    if (member.type != n.MethodDefinition || member.static)
                        throwError(member, "Unsuported class member");
                    if (member.key.name == 'constructor') {
                        defineInitialStateFn(_get, member.value.body.body);
                        processMethod(member);
                    } else {
                        var state_was_changed = processMethod(member);
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
                checkExpected(n.Identifier, identifier)
                var def = true;
                for (var i = 0; i < initialStateObj.properties.length; i++) {
                    var p = initialStateObj.properties[i];
                    if (p.key.name == identifier.name) {
                        if (!(n.Identifier.check(p.value) && p.value.name == 'undefined'))
                            throwError(identifier, "%0 already assigned", p.key.name);
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

        function processMethod(method) {
            var state_was_changed = false,
                emit_something = false;
            recast.visit(method.value.body.body, {
                visitThisExpression: visitThisExpression
            });

            if (!emit_something)

            //        if (state_was_changed) {
            //            methodBody.push(b.expressionStatement(b.callExpression(b.memberExpression(b.thisExpression(),
            //                b.identifier('emit')), [b.literal('change')])));
            //        }
                return state_was_changed;

            function visitThisExpression(path) {

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
                    emit_something = true;
                    var call_path = p;
                    var call_node = parent_node;
                    if (!call_path.parentPath)
                        throwError(call_node, 'Invalid emit');
                    var stmt_node = call_path.parentPath.node;
                    if (!(n.ExpressionStatement.check(stmt_node) &&
                            (call_node.arguments.length > 0) &&
                            n.Literal.check(call_node.arguments[0]) &&
                            typeof call_node.arguments[0].value === 'string'))
                        throwError(call_node, 'Invalid emit');

                    if (call_node.arguments.length != 1)
                        throwError(call_node, 'FluxEasy TODO: Event arguments');

                    var event_name = call_node.arguments[0].value;
                    var emit = b.expressionStatement(b.callExpression(
                        b.memberExpression(b.identifier('$references'),
                            b.identifier('forEach')), [
                            b.functionExpression(null, [b.identifier('r')], b.blockStatement([
                                b.expressionStatement(b.callExpression(
                                    b.memberExpression(
                                        b.memberExpression(b.identifier('r'), b.identifier('_on' + event_name)), b.identifier('forEach')), [b.identifier('$emitter')
                                        ]
                                ))
                            ]))
                ]));
                    call_path.replace(emit);

                    var def = true;
                    for (var i = 0; i < addRef.obj.properties.length; i++)
                        if (addRef.obj.properties[i].key.name == '_on' + event_name) {
                            def = false;
                            break;
                        }
                    if (def) {
                        var listenner = b.identifier('listenner');
                        //                    if(state_type) {
                        //                        if (!event_type)
                        //                            event_type = b.typeAlias(b.identifier('$EventType'), null,
                        //                                b.functionTypeAnnotation(b.voidTypeAnnotation, null));
                        //                        listenner.typeAnnotation = b.typeAnnotation(b.genericTypeAnnotation(event_type.id, []));;
                        //                    }
                        addRef.obj.properties.push(
                            b.property('init', b.identifier('_on' + event_name), b.arrayExpression([])),

                            b.property('init', b.identifier('add' + event_name + 'Listenner'),
                                b.functionExpression(null, [listenner],
                                    b.blockStatement([
                            b.expressionStatement(b.callExpression(
                                            b.memberExpression(b.memberExpression(b.identifier('ret'), b.identifier('_on' + event_name)),
                                                b.identifier('push')), [b.identifier('listenner')]))
                            ]))
                            ),

                            b.property('init', b.identifier('remove' + event_name + 'Listenner'),
                                b.functionExpression(null, [listenner], b.blockStatement([
                            b.variableDeclaration('var', [b.variableDeclarator(b.identifier('i'),
                                        b.callExpression(b.memberExpression(
                                            b.memberExpression(b.identifier('ret'), b.identifier('_on' + event_name)),
                                            b.identifier('indexOf')), [b.identifier('listenner')]))]),
                                    b.ifStatement(b.binaryExpression('>=', b.identifier('i'), b.literal(0)),
                                        b.expressionStatement(b.callExpression(b.memberExpression(
                                            b.memberExpression(b.identifier('ret'), b.identifier('_on' + event_name)),
                                            b.identifier('splice')), [b.identifier('i'), b.literal(1)])))
                                        ])))
                        );
                    }
                }

            }
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

    function throwError(node, messageFormat) {
        var error, args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            });
        if (node.loc) {
            error = new Error([msg, ' at (', inputFileName, ':', node.loc.start.line, ':', node.loc.start.column, ')'].join(''));
            error.inputFileName = node.inputFileName;
            error.loc = node.loc;
        } else {
            error = new Error([msg, ' at (', inputFileName, ')'].join(''));
            error.inputFileName = node.inputFileName;
            error.loc = node.loc;
        }
        error.description = msg;
        throw error;
    }

    function checkExpected(type, node) {
        if (!type.check(node))
            throwError(node, "%1 expected here", type);
    }

}

module.exports.transform_file = transform_file;
module.exports.transform_string = transform_string;
module.exports.transform_ast = transform_ast;
