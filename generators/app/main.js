const Chalk = require("chalk");
const Figlet = require("figlet");

module.exports = {
    writeTitle () {
        return new Promise((resolve, reject) => {
            Figlet(
                "Happy Little Doc",
                {
                    font: "Larry 3D",
                    horizontalLayout: "default",
                    verticalLayout: "default",
                    width: 700,
                    whitespaceBreak: true
                },
                (err, data) => {
                    if (err) {
                        console.log(Chalk.red("Something went wrong"));
                        console.log(err)
                        reject();
                    }

                    console.log(Chalk.blue(data));
                    resolve();
                }
            );
        });
    }
}