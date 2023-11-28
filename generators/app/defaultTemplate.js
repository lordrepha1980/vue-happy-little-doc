
const Nunjucks = require('nunjucks')
const Fs = require('fs')
const Path = require('path')
const FsExtra = require('fs-extra')

module.exports = { 
    create ({ content, configFile }) {
        Nunjucks.configure(__dirname,{ autoescape: true });

        if ( Fs.existsSync('./happy-little-docs') )
            Fs.rmSync('./happy-little-docs', { recursive: true, force: true })
        //create folders
        Fs.mkdirSync('./happy-little-docs')
        Fs.mkdirSync('./happy-little-docs/all')
        Fs.mkdirSync('./happy-little-docs/pages')
        Fs.mkdirSync('./happy-little-docs/components')
        Fs.mkdirSync('./happy-little-docs/stores')
        Fs.mkdirSync('./happy-little-docs/ast')

        //copy default template
        FsExtra.copySync(`${__dirname}/templates/default/static`, './happy-little-docs/static');
        const cf = configFile || {title:'Happy Little Docs'}

        const html = Nunjucks.render(`templates/default/index.html`, { items: content, root: '.', configFile: cf } );
        Fs.writeFileSync(`./happy-little-docs/index.html`, html)
        for ( let type of Object.keys(content) ) {
            for ( let item of content[type] ) {
                
                const html = Nunjucks.render(`templates/default/index.html`, { items: content, configFile: cf, item, root: '..' } );
                Fs.writeFileSync(`./happy-little-docs/${type}/${item.name}.html`, html)
                
                // if ( type === 'stores' ) {
                //     Fs.writeFileSync(`./happy-little-docs/ast/${item.name}.json`, JSON.stringify(item.storeProps.ast || '', null, 2))
                // }
            }
        }
    }
}