const Chalk = require("chalk")
const Fs = require("fs")
const Path = require('path')
const uid = require('uuid')
const Recast = require('recast')
const JSBeautify = require('js-beautify').js
const { parse, compileTemplate, compileScript, compileStyle } = require('vue/compiler-sfc');
module.exports = {
    readProject ({ dirname, configFile }) {
        const readdirSync = ({sourcePath, file, files}) => {
            if (file === 'node_modules') 
                return

            if (Fs.statSync(sourcePath).isDirectory()) {
                Fs.readdirSync(sourcePath).map( item => {
                    try {
                        const newPath = Path.join(sourcePath, item)
                        return readdirSync({sourcePath: newPath, file: item, files })
                    } catch (error) {
                        console.log(Chalk.red('Error'), error)
                    }
                })
            } else {
                if ( [".vue", ".js", ".ts"].includes(Path.extname(file))  )
                    files.push(sourcePath)
            }
            return files
        }
        
        if ( configFile ) {
            try {
                console.log(Chalk.green('hld-config.json found'))
                const result = {}
                for ( let item of Object.keys(configFile.path) ) {
                    console.log(Chalk.green(`Read folder ${item}`), Path.join(dirname, configFile.path[item]))
                    const sourcePath = Path.join(dirname, configFile.path[item])
                    result[item] = readdirSync({sourcePath, files: []})
                    result[item] = result[item]
                }

                return result
            } catch (error) {
                console.log(Chalk.red('hld-config.json error'), error)
            }
            
        } else {
            console.log(Chalk.green('hld-config.json not found generate all files'))
            console.log(Chalk.green(`Read folder all`))
            return { all: readdirSync({sourcePath: dirname, files: []}) }
        }
    },

    readFiles({ files }) {
        let result = {}
        for ( let type of Object.keys(files) ) {
            result[type] = []
            for ( let file of files[type] ) {
                const item = {
                    id: uid.v4(),
                    path: file,
                    name: Path.basename(file),
                    defineEmits: null,
                    defineProps: null,
                    comments: [],
                    styles: null,
                    template: null,
                    slots: null,
                    lang: null,
                }
                const data = Fs.readFileSync(file, 'utf-8')
                //console.log(parse(data.toString()).descriptor);
                if ( type !== 'stores' ) {
                    const descriptor = parse(data.toString()).descriptor;

                    if (descriptor.scriptSetup?.lang)
                        item.lang = descriptor.scriptSetup.lang

                    if ( descriptor.styles?.length > 0 )
                        item.styles = descriptor.styles[0].content;

                    if ( descriptor.template?.content ) {
                        item.template = descriptor.template.content;
                        //slots
                        // const regex = /<slot\b[^>]*>[\s\S]*?<\/slot>/gs;
                        // const match = Array.from(descriptor.template?.content?.matchAll(regex), match => match[0]);
                        // if (match && match.length > 0) {
                        //     item.slots = match;
                        // }


                        const regex = /<slot(?:\s+name="([^"]+)")?>(.*?)<\/slot>/g;
                        let match;
                        while ((match = regex.exec(descriptor.template?.content)) !== null) {
                            if (!item.slots) 
                                item.slots = []

                            item.slots.push({
                                name: match[1] || 'default',
                                content: match[2]
                            })
                        }
                    }

                    for ( let type of ['defineProps', 'defineEmits'] ) {
                        let regex = null;
                        switch( type ) {
                            case 'defineProps':
                                regex = /defineProps\(({[\s\S]+?})\)/;
                                break;
                            case 'defineEmits':
                                regex = /defineEmits\(([[\s\S]+?])\)/;
                                break;
                        }
                        
                        const match = descriptor.scriptSetup?.content?.match(regex);
    
                        if (match) {
                            const propsContent = match[1];
                            item[type] = propsContent;
                        }
                    }
                }

                const getBetterType = (type) => {
                    switch (type) {
                        case 'TSNumberKeyword':
                            return 'number'
                        case 'TSStringKeyword':
                            return 'string'
                        default:
                            return 'any'
                    }
                }

                const getFunctionDescription = (input, code) => {
                    const params = [];
                    for (let index = 0; index < input.params.length; index++) {
                        const param = input.params[index];

                        //if params a destructed object
                        if ( param.properties) {
                            const input = param.properties[0].loc.lines.infos
                            const start = param.properties[0].loc.start.line
                            const end = param.properties[0].loc.end.line
                            let line = ''
                            for (let i = start - 1; i < end; i++) {
                                line = input[i];
                            }

                            const regex = /\((.*?)\)/s;
                            const matches = line.line.match(regex);
                            if (matches) {
                                const extractedCode = matches[1].trim();
                                params.push(extractedCode)
                            }
                        } else  {
                            params.push(`${param.name}: ${getBetterType(param.typeAnnotation?.typeAnnotation?.type)}`)
                        }
                    }

                    
                 
                    let returnType = 'any';
                    if (input.async) returnType = `Promise<${returnType}>`
                    
                    return `${input.async ? 'async ' : ''}${input.key.name}(${params.join(', ')}): ${returnType};`; 
                }

                const getLinesBetweenAsString = (input, start, end, noJson) => {
                    const lines = []
                    for (let i = start - 1; i < end; i++) {
                        lines.push(input[i]);
                    }

                    return lines.join('\n');
                }
                 

                if ( type === 'stores' ) {
                    const beautifyOptions = { 
                        indent_size: 4, 
                        space_in_empty_paren: true, 
                        brace_style: 'preserve-inline',
                        break_chained_methods: true, 
                    }; 
                    const ast = Recast.parse(data, { parser: require('recast/parsers/typescript') });
                    const lines = ast.loc.lines.infos.map((f) => f.line);

                    const storeInfo = {
                        storeName: null,
                        storeProps: {
                            state: null, 
                            getters: null, 
                            actions: null,
                            ast
                        },
                        types: []
                    }

                    const actions = []
                    for (let i = 0; i < ast.program.body.length; i++) {
                        const body = ast.program.body[i];
                        if (body.type === 'ExportNamedDeclaration') {
                            if (body.exportKind === 'type') {
                                storeInfo.types.push(JSBeautify(getLinesBetweenAsString(lines, body.loc.start.line, body.loc.end.line), beautifyOptions));
                            } else if (body.exportKind === 'value') {
                                storeInfo.storeName = body.declaration.declarations[0].init.arguments[0].value
                                for (let i = 0; i < body.declaration.declarations[0].init.arguments[1].properties.length; i++) {
                                    const element = body.declaration.declarations[0].init.arguments[1].properties[i];
                                    if (element.key.loc.identifierName === 'actions') {
                                        // const actions = []
                                        for (let i = 0; i < element.value.properties.length; i++) {
                                            const func = element.value.properties[i];
                                            actions.push(getFunctionDescription(func, data));
                                        }
                                        continue;
                                    }
                                    
                                    storeInfo.storeProps[element.key.loc.identifierName] = JSBeautify(
                                        `{${getLinesBetweenAsString(lines, element.loc.start.line + 1, element.loc.end.line - 1)}}`,
                                        beautifyOptions
                                    );
                                }
                            }
                        }
                    }
                    //${storeInfo.storeName.charAt(0).toUpperCase() + storeInfo.storeName.slice(1)}
                    if (storeInfo.storeName)
                        storeInfo.storeProps.actions = JSBeautify(`interface Actions {${actions.join('\n')}}`, beautifyOptions)

                    item.storeName      = storeInfo.storeName
                    item.storeProps     = storeInfo.storeProps
                    item.types          = storeInfo.types
                }
                result[type].push(item)
                
            }

            result[type].sort((a, b) => a.name.localeCompare(b.name))
        }
        return result
    }
    
}