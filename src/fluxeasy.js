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
                        path.replace(transpile(superClazz.property.name, clazz));
                        return false;
                    } else throwError(superClazz.object.name, 'FluxEasy just do Store or View transformation')
                }
            }
            this.traverse(path);
        }
    });
    return source_ast;

    function transpile(clazzName, clazz) {

        var transpilingStore = clazzName == 'Store',
            transpilingView = clazzName == 'View';

        var state_type, event_type,
            refobject = b.objectExpression([]),
            $instance = b.identifier('$instance'),
            $references = b.identifier('$references'),
            $state, $dispatchTokens;

        if (transpilingStore) {
            $dispatchTokens = b.identifier('$dispatchTokens');
            $state = b.identifier('$state');
        }

        var private_vars = b.variableDeclaration('var', [
            b.variableDeclarator($references, null),
            b.variableDeclarator($instance, null),
        ]);

        var processed_instance;
        processInstance();

        class_body = [];

        if (transpilingStore) {
            private_vars.declarations.push(
                b.variableDeclarator($dispatchTokens, null),
                b.variableDeclarator(b.identifier($state.name), null)
            );

            if (state_type) {
                class_body.unshift(state_type);
                private_vars.declarations[private_vars.declarations.length - 1]
                    .id.typeAnnotation = b.typeAnnotation(b.genericTypeAnnotation(state_type.id, null));
            }
            if (event_type)
                class_body.unshift(event_type);
        }

        class_body.push(
            private_vars,
            b.returnStatement(b.objectExpression([
            b.property('init', b.identifier('create' + clazzName + 'Reference'), fnCreateReference())
          ])),
            fnCreateInstance(),
            fnDestroyInstance()
        );

        return b.functionDeclaration(clazz.id, [], b.blockStatement(class_body));

        function fnCreateInstance() {
            var body = [b.expressionStatement(b.assignmentExpression('=', $references, b.arrayExpression([])))];
            if (clazzName == 'Store')
                fnCreateStore();
            if (clazzName == 'View')
                fnCreateView();

            return b.functionDeclaration(b.identifier('create' + clazzName + 'Instance'), [b.identifier('dispatcher')], b.blockStatement(body));

            function fnCreateStore() {
                body.push(b.expressionStatement(b.assignmentExpression('=', $instance,
                    b.objectExpression(processed_instance.get
                        .concat(processed_instance.set)
                        .concat(processed_instance.internals)))));

                var dispatchTokensReg = b.objectExpression([]);
                processed_instance.get.forEach(function (prop_method) {
                    if (prop_method.key.name != 'getInitialState') {
                        refobject.properties.push(b.property(
                            'init', prop_method.key,
                            b.callExpression(b.memberExpression(b.memberExpression($instance, prop_method.key),
                                b.identifier('bind')), [$instance])
                        ));
                    }
                });

                processed_instance.set.forEach(function (prop_method) {
                    if (prop_method.key.name == 'getInitialState')
                        return;
                    var fn = prop_method.value;
                    var action_name = b.literal(clazz.id.name + '_' + prop_method.key.name)
                    refobject.properties.push(b.property(
                        'init', prop_method.key,
                        b.functionExpression(b.identifier(prop_method.key.name + "_dispatch"),
                            fn.params, b.blockStatement([
                        b.expressionStatement(b.callExpression(
                                    b.memberExpression(b.identifier('dispatcher'), b.identifier('dispatch')), [b.objectExpression([
                                      b.property('init', b.identifier('action'), action_name)].concat(fn.params.map(function (p) {
                                        return b.property('init', b.identifier('arg_' + p.name), p)
                                    })))]))]))));

                    dispatchTokensReg.properties.push(
                        b.property('init', prop_method.key, b.callExpression(
                            b.memberExpression(b.identifier('dispatcher'), b.identifier('register')), [
                                    b.functionExpression(null, [b.identifier('payload')], b.blockStatement([
                                        b.ifStatement(b.binaryExpression('===',
                                            b.memberExpression(b.identifier('payload'), b.identifier('action')),
                                            action_name),
                                        b.expressionStatement(
                                            b.callExpression(b.memberExpression(
                                                b.memberExpression($instance, prop_method.key), b.identifier('call')), [
                                        $instance
                                    ].concat(fn.params.map(function (p) {
                                                return b.memberExpression(b.identifier('payload'), b.identifier('arg_' + p.name))
                                            })))))
                            ]))]
                        )));
                });
                body.push(
                    b.expressionStatement(b.assignmentExpression('=', $state,
                        b.callExpression(b.memberExpression($instance, b.identifier('getInitialState')), [])
                    )), b.expressionStatement(
                        b.assignmentExpression('=', $dispatchTokens, dispatchTokensReg)));
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

            function fnCreateView() {
                var methods = [
                    ]
                    .concat(processed_instance.get)
                    .concat(processed_instance.set)
                    .concat(processed_instance.internals);
                body.push(b.expressionStatement(b.assignmentExpression('=', $instance,
                    b.callExpression(
                        b.memberExpression(b.identifier('React'), b.identifier('createComponent')), [b.objectExpression(methods)]
                    ))));
            }
        }

        function fnDestroyInstance() {
            var body = [
            b.expressionStatement(b.unaryExpression('delete', $instance)),
            b.expressionStatement(b.unaryExpression('delete', $references)),
        ];
            if (clazzName === 'Store') {
                body.unshift(
                    b.expressionStatement(
                        b.callExpression(b.memberExpression(b.identifier('dispatcher'), b.identifier('unregister')), [
                b.identifier('$dispatchToken')])));
                body.push(
                    b.expressionStatement(b.unaryExpression('delete', $state)),
                    b.expressionStatement(b.unaryExpression('delete', b.identifier('$dispatchToken'))),
                    b.expressionStatement(b.unaryExpression('delete', b.identifier('$emitter')))
                );
            }
            return b.functionDeclaration(b.identifier('destroy' + clazzName + 'Instance'), [b.identifier('dispatcher')],
                b.blockStatement(body));
        }

        function processInstance() {
            var initialStateObj, initialStateFn,
                _get = [],
                _set = [];

            processed_instance = {
                get: _get,
                set: _set,
                internals: []
            };

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
            return;

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
                emit_something = false,
                valueLinkAux = {
                    declarations: null
                };
            var visits;
            if (transpilingStore)
                visits = {
                    visitThisExpression: visitThisExpressionForStore,
                };
            if (transpilingView) {
                visits = {};
                if (method.key.name == 'render')
                    visits.visitJSXAttribute = visitJSXAttribute;
            }
            recast.visit(method.value.body.body, visits);

            if (transpilingStore && state_was_changed && !emit_something && method.key.name != 'constructor')
                throwError(method, "method %0 changed state then it must emit some event", method.key.name);

            //        if (state_was_changed) {
            //            methodBody.push(b.expressionStatement(b.callExpression(b.memberExpression(b.thisExpression(),
            //                b.identifier('emit')), [b.literal('change')])));
            //        }
            return state_was_changed;

            function visitThisExpressionForStore(path) {

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
                    if (transpilingStore)
                        path.replace($state);
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
                        b.memberExpression($references,
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
                    for (var i = 0; i < refobject.properties.length; i++)
                        if (refobject.properties[i].key.name == '_on' + event_name) {
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
                        refobject.properties.push(
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

            function visitJSXAttribute(path) {
                var node = path.node;
                if (n.JSXIdentifier.check(node.name) &&
                    n.JSXExpressionContainer.check(node.value) &&
                    node.name.name == 'valueLink') {
                    var fnname = [];
                    var v = node.value.expression;
                    var m1, m2;
                    while (v) {
                        if (n.Identifier.check(v) && /^valueLink_/.test(v.name)) {
                            v = null;
                            fnname = null;
                        } else if (n.MemberExpression.check(v)) {
                            if (!n.ThisExpression.check(v.object) || v.property.name != 'state') {
                                fnname.unshift(v.property.name);
                                m2 = v.property;
                                m1 = m2;
                            }
                            v = v.object;
                        } else if (n.ThisExpression.check(v)) {
                            v = null;
                        } else throwError(node.value, 'Invalid value');
                    }
                    if (fnname != null) {
                        fnname = 'valueLink_' + fnname.join('_');
                        var expr = path.get('value').get('expression');
                        if (!valueLinkAux[fnname]) {
                            var decl = b.variableDeclarator(b.identifier(fnname), b.objectExpression(
                                [
                                    b.property('init', b.identifier('value'), node.value.expression),
                                    b.property('init', b.identifier('requestChange'),
                                        b.memberExpression(b.thisExpression(), b.identifier(fnname + '_change')))
                                ]
                            ));
                            if (valueLinkAux.declarations)
                                valueLinkAux.declarations.push(decl);
                            else {
                                valueLinkAux.declarations = [decl];
                                method.value.body.body.unshift(
                                    b.variableDeclaration('var', valueLinkAux.declarations));
                            }

                            if (!n.Identifier.check(m2))
                                throwError(m2, "TODO: valueLink with complex objects");
                            processed_instance.internals.push(b.property('init', b.identifier(fnname + '_change'),
                                b.functionExpression(null, [b.identifier('newValue')], b.blockStatement([
b.expressionStatement(b.callExpression(b.memberExpression(b.thisExpression(), b.identifier('setState')), [b.objectExpression([
                                           b.property('init', m2, b.identifier('newValue'))
                                       ])]))
                                            ]))
                            ));
                            valueLinkAux[fnname] = true;
                        }
                        expr.replace(b.identifier(fnname));
                    }
                }
                this.traverse(path);
            }
        }

        function fnCreateReference() {
            refobject.properties.push(
                b.property('init', b.identifier('release' + clazzName + 'Reference'), fnReleaseRef())
            );
            if (transpilingStore)
                refobject.properties.push(
                    b.property('init', b.identifier('getState'), b.functionExpression(null, [], b.blockStatement(
                      [b.returnStatement($state)]))),
                    b.property('init', b.identifier('dispatchToken'), $dispatchTokens));

            var body = [
              b.ifStatement(
                    b.binaryExpression('==', b.memberExpression($references, b.identifier('length')), b.literal(0)),
                    b.expressionStatement(b.callExpression(
                        b.identifier('create' + clazzName + 'Instance'), [b.identifier('dispatcher')]))),
              b.variableDeclaration('var', [b.variableDeclarator(b.identifier('ref'),
                    refobject
              )])
            ];

            body.push(b.expressionStatement(b.callExpression(
                    b.memberExpression($references, b.identifier('push')), [b.identifier('ref')])),
                b.returnStatement(b.identifier('ref'))
            );

            return b.functionExpression(b.identifier('add' + clazzName + 'Reference'), [b.identifier('dispatcher')], b.blockStatement(body));
        }

        function fnReleaseRef(name) {
            return b.functionExpression(b.identifier('release' + clazzName + 'Reference'), [], b.blockStatement([
              b.ifStatement(
                    b.logicalExpression('&&',
                        b.binaryExpression('==', b.memberExpression($references, b.identifier('length')), b.literal(1)),
                        b.binaryExpression('==', b.memberExpression($references, b.literal(0), true), b.identifier('ref'))),
                    b.expressionStatement(b.callExpression(b.identifier('destroy' + clazzName + 'Instance'), [])),
                    b.blockStatement([
                            b.variableDeclaration('var', [b.variableDeclarator(b.identifier('i'),
                            b.callExpression(b.memberExpression($references,
                                b.identifier('indexOf')), [b.identifier('ref')]))]),
                    b.expressionStatement(b.callExpression(b.memberExpression($references,
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
