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
        },
        visitJSXElement: function (path) {
            if (!n.ExpressionStatement.check(path.parentPath.node))
                return false;
            var node = path.node;
            var clazzName = node.openingElement.name;
            clazzName.type = "Identifier";

            var clazzBody = [];

            generate();

            var clazz = b.classDeclaration(clazzName, b.classBody(clazzBody), b.memberExpression(b.identifier("FluxEasy"), b.identifier("View")));
            path.replace(clazz);
            this.traverse(path);

            function generate() {
                var renderElement = null;

                for (var i = 0; i < node.children.length; i++) {
                    var c = node.children[i];
                    if (n.Literal.check(c)) {
                        if (c.value.trim() != "")
                            throwError(c, "Invalid content");
                    } else if (n.JSXElement.check(c)) {
                        if (c.openingElement.name.name == "script")
                            generateScript(c);
                        else {
                            if (renderElement)
                                throwError(c, "Adjacent JSX elements must be wrapped in an enclosing tag");
                            renderElement = c;
                        }
                    } else throwError(c, "Invalid content");
                }

                if (!renderElement)
                    throwError(node, "Has nothing to renderize");
                generateRender(renderElement);
            }

            function generateScript(c) {

            }

            function generateRender(renderElement) {
                var fnBody = [];
                fnBody.push(b.returnStatement(renderElement));
                var fn = b.functionExpression(null, [], b.blockStatement(fnBody));
                clazzBody.push(b.methodDefinition('init', b.identifier("render"), fn, false));
            }
        }
    });
    return source_ast;

    function transpile(clazzName, clazz) {

        var transpilingStore = clazzName == 'Store',
            transpilingView = clazzName == 'View';

        var state_type, event_without_param, event_with_param,
            refobject = b.objectExpression([]),
            $instance = b.memberExpression(clazz.id, b.identifier('__instance')),
            $instanceobj = b.objectExpression([]),
            $refreshView,
            $requires = b.memberExpression(clazz.id, b.identifier('__requires')),
            $requiresobj = b.objectExpression([]),
            $destroy_body = [],
            $dependents = b.memberExpression(clazz.id, b.identifier('__dependents')),
            $emitter, $state, $dispatchTokens, dispatchTokensReg = b.objectExpression([]);

        if (transpilingStore) {
            $dispatchTokens = b.memberExpression(clazz.id, b.identifier('__dispatchTokens'));
            $state = b.memberExpression(clazz.id, b.identifier('__state'));
            $emitter = b.memberExpression(clazz.id, b.identifier('__emitter'));
        }

        var processed_instance;
        processInstance();

        if (transpilingStore) {

            if (state_type) {
                class_body.unshift(state_type);
                private_vars.declarations[private_vars.declarations.length - 1]
                    .id.typeAnnotation = b.typeAnnotation(b.genericTypeAnnotation(state_type.id, null));
            }
            if (event_with_param)
                class_body.unshift(event_with_param);
            if (event_without_param)
                class_body.unshift(event_without_param);
        }

        return b.variableDeclaration('var', [b.variableDeclarator(clazz.id, b.objectExpression([
            b.property('init', b.identifier('create' + clazzName + 'Reference'), fnCreateReference())
          ]))]);

        function fnCreateInstance() {
            var body = [b.expressionStatement(b.assignmentExpression('=', $dependents, b.arrayExpression([])))];
            if ($requiresobj.properties.length)
                body.push(
                    b.expressionStatement(b.assignmentExpression('=', $requires, $requiresobj)));

            if (clazzName == 'Store')
                fnCreateStore();
            if (clazzName == 'View')
                fnCreateView();

            return b.functionDeclaration(b.identifier('create' + clazzName + 'Instance'), [], b.blockStatement(body));

            function fnCreateStore() {
                $instanceobj.properties = $instanceobj.properties
                    .concat(processed_instance.get)
                    .concat(processed_instance.set)
                    .concat(processed_instance.internals);

                body.push(b.expressionStatement(b.assignmentExpression('=', $instance, $instanceobj)));

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
                            b.assignmentExpression('=', $emitter, b.memberExpression(b.identifier('dispatcher'), b.identifier('emmiter')))),
                        b.expressionStatement(
                            b.assignmentExpression('=', $emitter,
                                b.functionExpression(null, [b.identifier('fn'), b.identifier('e')], b.blockStatement([
                        b.expressionStatement(b.callExpression(b.identifier('fn'), [b.identifier('e')]))
                    ])))))
                );
            }

            function fnCreateView() {
                $instanceobj.properties = $instanceobj.properties
                    .concat(processed_instance.get)
                    .concat(processed_instance.set)
                    .concat(processed_instance.internals);
                if ($refreshView)
                    $instanceobj.properties.push($refreshView);
                body.push(b.expressionStatement(b.assignmentExpression('=', $instance,
                    b.callExpression(
                        b.memberExpression(b.identifier('React'), b.identifier('createClass')), [$instanceobj]
                    ))));
            }
        }

        function fnDestroyInstance() {
            if (clazzName === 'Store') {
                dispatchTokensReg.properties.forEach(
                    function (t) {
                        $destroy_body.push(
                            b.expressionStatement(b.callExpression(
                                b.memberExpression(b.identifier('dispatcher'), b.identifier('unregister')), [b.memberExpression($dispatchTokens, t.key)]))
                        );
                    }
                );
                $destroy_body.push(
                    b.expressionStatement(b.unaryExpression('delete', $dispatchTokens)),
                    b.expressionStatement(b.unaryExpression('delete', $state)),
                    b.expressionStatement(b.unaryExpression('delete', $emitter))
                );
            }
            if ($requiresobj.properties.length)
                $destroy_body.push(b.expressionStatement(b.unaryExpression('delete', $requires)));

            $destroy_body.push(
                b.expressionStatement(b.unaryExpression('delete', $instance)),
                b.expressionStatement(b.unaryExpression('delete', $dependents))
            );
            return b.functionDeclaration(b.identifier('destroy' + clazzName + 'Instance'), [],
                b.blockStatement($destroy_body));
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
                            n.MemberExpression.check(stmt.expression.left)
                        ) {
                            if (n.ThisExpression.check(stmt.expression.left.object)) {
                                var r = stmt.expression.right;
                                if (n.CallExpression.check(r) && n.MemberExpression.check(r.callee) && /create.*Reference/.test(r.callee.property.name)) {
                                    r.arguments.push(b.identifier('dispatcher'));
                                    $requiresobj.properties.push(b.property('init', stmt.expression.left.property, r));
                                    var ref = b.memberExpression($requires, stmt.expression.left.property);
                                    $destroy_body.push(
                                        b.expressionStatement(b.callExpression(b.memberExpression(ref, b.identifier(r.callee.property.name.replace('create', 'release'))), [])));
                                    $instanceobj.properties.push(b.property('init', stmt.expression.left.property, ref));
                                } else
                                    setInitialState(stmt.expression.left.property, null, stmt.expression.right);
                            } else if (n.Identifier.check(stmt.expression.left.object) && stmt.expression.left.object.name == clazz.id.name) {
                                var varName = stmt.expression.left.property;
                                var value = stmt.expression.right;
                                var p = b.property('init', varName, value);
                                $instanceobj.properties.push(p);
                            } else {
                                throwError(stmt.expression.left.object, "Too complex");
                            }
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
                    visitCallExpression: visitAddEventListener,
                    visitThisExpression: visitThisExpressionForStore
                };
            if (transpilingView) {
                visits = {
                    visitCallExpression: visitAddEventListener
                };
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
                if (!n.MemberExpression.check(parent_node)) {
                    this.traverse(path);
                    return;
                }
                var l = p;
                var last_node = parent_node;
                while (n.MemberExpression.check(parent_node)) {
                    l = p;
                    last_node = parent_node;
                    p = p.parentPath;
                    parent_node = p.node;
                }

                check_state_changing();

                if (n.CallExpression.check(parent_node) && n.MemberExpression.check(last_node) && n.ThisExpression.check(last_node.object)) {
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

                    var has_params;

                    if (call_node.arguments.length == 1)
                        has_params = false;
                    else if (call_node.arguments.length <= 2) {
                        if (!n.ObjectExpression.check(call_node.arguments[1]))
                            throwError(call_node, 'Use an object as event arguments');
                        has_params = true;
                    } else
                        throwError(call_node, 'Use an object as event arguments');

                    var event_name = call_node.arguments[0].value;
                    event_name = event_name[0].toUpperCase() + event_name.substr(1);
                    var emit;

                    if (has_params)
                        emit = b.expressionStatement(b.callExpression(
                            b.memberExpression($dependents,
                                b.identifier('forEach')), [
                            b.functionExpression(null, [b.identifier('$ref')], b.blockStatement([
                                b.expressionStatement(b.callExpression(
                                        b.memberExpression(
                                            b.memberExpression(b.identifier('$ref'),
                                                b.identifier('_on' + event_name)),
                                            b.identifier('forEach')), [
                                            b.functionExpression(null, [b.identifier('$event')], b.blockStatement([
                                b.expressionStatement(b.callExpression(
                                                    $emitter, [b.identifier('$event'), call_node.arguments[1]
                                ]))
                                        ]))
                            ]))
                       ]))]));
                    else
                        emit = b.expressionStatement(b.callExpression(
                            b.memberExpression($dependents,
                                b.identifier('forEach')), [
                            b.functionExpression(null, [b.identifier('r')], b.blockStatement([
                                b.expressionStatement(b.callExpression(
                                        b.memberExpression(
                                            b.memberExpression(b.identifier('r'),
                                                b.identifier('_on' + event_name)),
                                            b.identifier('forEach')), [$emitter
                                        ]
                                    ))
                            ]))
                          ]));

                    var def = true;
                    for (var i = 0; i < refobject.properties.length; i++)
                        if (refobject.properties[i].key.name == '_on' + event_name) {
                            def = false;
                            break;
                        }
                    if (def) {
                        var listener = b.identifier('listener');
                        // TODO: define typeAlias for events
                        //                        if (state_type) {
                        //                            if (has_params)
                        //                            ;
                        //                            else
                        //                            if (!event_without_param)
                        //                                event_without_param = b.typeAlias(b.identifier('$EventWithoutParams'), null,
                        //                                    b.declareFunction(b.functionTypeAnnotation([], {
                        //                                        "type": "VoidTypeAnnotation"
                        //                                    }, null, null)));
                        //                            listener.typeAnnotation = b.typeAnnotation(b.genericTypeAnnotation(event_without_param.id, null));;
                        //                        }
                        refobject.properties.push(
                            b.property('init', b.identifier('_on' + event_name), b.arrayExpression([]))
                        );

                    }
                    call_path.replace(emit);

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
                                var p = path;
                                while (!/\wStatement/.test(p.node.type))
                                    p = p.parentPath;
                                p.insertBefore(b.variableDeclaration('var', valueLinkAux.declarations))
                                    //                                method.value.body.body.unshift(
                                    //                                    );
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

            function visitAddEventListener(path) {
                var node = path.node;
                if (n.MemberExpression.check(node.callee) && (node.callee.property.name == 'addEventListener')) {
                    if (node.arguments.length == 2) {
                        if (n.ThisExpression.check(node.arguments[1])) {
                            if (transpilingStore)
                                throwError(node, "use addEventListener(event, function)");
                            if (!$refreshView)
                                $refreshView = b.property('init', b.identifier('refreshView'),
                                    b.functionExpression(null, [], b.blockStatement([b.expressionStatement(
                                            b.callExpression(b.memberExpression(b.thisExpression(),
                                                b.identifier('setState')), [b.objectExpression([])]))
                            ])));
                            node.arguments[1] = b.memberExpression(b.thisExpression(),
                                b.identifier('refreshView'));
                            path.replace(node);
                        }
                    } else if (transpilingView)
                        throwError(node, "use addEventListener(event, function|this) - this rerender the view");
                    else
                        throwError(node, "use addEventListener(event, function)");
                }
                this.traverse(path);
            }
        }

        function fnCreateReference() {
            refobject.properties.push(
                b.property('init', b.identifier('release' + clazzName + 'Reference'), fnReleaseRef())
            );
            if (transpilingStore) {
                refobject.properties.push(
                    b.property('init', b.identifier('getState'), b.functionExpression(null, [], b.blockStatement(
                      [b.returnStatement($state)]))),
                    b.property('init', b.identifier('dispatchTokens'), $dispatchTokens),


                    b.property('init', b.identifier('addEventListener'),
                        b.functionExpression(null, [b.identifier('event'), b.identifier('listener')],
                            b.blockStatement([
                                b.variableDeclaration('var', [b.variableDeclarator(b.identifier('e'),
                                    b.memberExpression(b.identifier('ref'), b.binaryExpression('+', b.literal('_on'), b.identifier('event')), true))]),
                                b.ifStatement(b.unaryExpression('!', b.identifier('e')),
                                    b.throwStatement(b.newExpression(b.identifier('Error'), [b.binaryExpression('+', b.literal('Invalid event: '), b.identifier('event'))]))),
                                b.expressionStatement(b.callExpression(
                                    b.memberExpression(b.identifier('e'),
                                        b.identifier('push')), [b.identifier('listener')]))
                                ]))),

                    b.property('init', b.identifier('removeEventListener'),
                        b.functionExpression(null, [b.identifier('event'), b.identifier('listener')],
                            b.blockStatement([
                                b.variableDeclaration('var', [b.variableDeclarator(b.identifier('e'),
                                    b.memberExpression(b.identifier('ref'), b.binaryExpression('+', b.literal('_on'), b.identifier('event')), true))]),
                                b.ifStatement(b.unaryExpression('!', b.identifier('e')),
                                    b.throwStatement(b.newExpression(b.identifier('Error'), [b.binaryExpression('+', b.literal('Invalid event: '), b.identifier('event'))]))),

                                                b.variableDeclaration('var', [b.variableDeclarator(b.identifier('i'),
                                    b.callExpression(b.memberExpression(b.identifier('e'),
                                        b.identifier('indexOf')), [b.identifier('listener')]))]),
                                                        b.ifStatement(b.binaryExpression('>=', b.identifier('i'), b.literal(0)),
                                    b.expressionStatement(b.callExpression(
                                        b.memberExpression(b.identifier('e'),
                                            b.identifier('splice')), [b.identifier('i'), b.literal(1)])))
                                                            ])))
                );


            }
            if (transpilingView)
                refobject.properties.push(
                    b.property('init', b.identifier('Class'), $instance));

            var body = [
              b.ifStatement(
                    b.unaryExpression('!', $instance, true),
                    b.expressionStatement(b.callExpression(
                        b.identifier('create' + clazzName + 'Instance'), []))),
              b.variableDeclaration('var', [b.variableDeclarator(b.identifier('ref'),
                    refobject
              )])
            ];

            body.push(b.expressionStatement(b.callExpression(
                    b.memberExpression($dependents, b.identifier('push')), [b.identifier('ref')])),
                b.returnStatement(b.identifier('ref'))
            );

            body.push(
                fnCreateInstance(),
                fnDestroyInstance()
            );

            return b.functionExpression(b.identifier('create' + clazzName + 'Reference'), [b.identifier('dispatcher')], b.blockStatement(body));
        }

        function fnReleaseRef(name) {
            return b.functionExpression(b.identifier('release' + clazzName + 'Reference'), [], b.blockStatement([
              b.ifStatement(
                    b.logicalExpression('&&',
                        b.binaryExpression('==', b.memberExpression($dependents, b.identifier('length')), b.literal(1)),
                        b.binaryExpression('==', b.memberExpression($dependents, b.literal(0), true), b.identifier('ref'))),
                    b.expressionStatement(b.callExpression(b.identifier('destroy' + clazzName + 'Instance'), [])),
                    b.blockStatement([
                            b.variableDeclaration('var', [b.variableDeclarator(b.identifier('i'),
                            b.callExpression(b.memberExpression($dependents,
                                b.identifier('indexOf')), [b.identifier('ref')]))]),
                    b.expressionStatement(b.callExpression(b.memberExpression($dependents,
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
