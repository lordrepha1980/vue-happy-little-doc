const Chalk = require("chalk");
const Fs = require("fs");
const Path = require('path')
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
                if ( Path.extname(file) === '.vue' )
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
                result[type].push(item)
            }
        }
        return result
    }
    
}