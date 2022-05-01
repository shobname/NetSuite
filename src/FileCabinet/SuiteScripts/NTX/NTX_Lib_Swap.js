/**
 * @NApiVersion 2.1
 */
define([],
    
    () => {

            const constructTable=(_mainbody)=>{
                    _mainbody += '<style>\n' +
                        '.borderclass {\n' +
                        '  border: 1px solid black;\n' +
                        '  border-collapse: collapse;\n' +
                        '}\n' +
                        '\n' +
                        '#t01 {\n' +
                        '  width: 100%;    \n' +

                        '}\n' +
                        'th{font-weight: bold;}' +

                        '</style>'
                    _mainbody += '<table id="t01" class ="borderclass">\n' +
                        '  <thead style ="background: #DDDDDD;"><tr class="borderclass">\n' +

                        '    <th class="borderclass">OLD COMPONENT</th>\n' +
                        '    <th class="borderclass">QUANTITY</th> \n' +
                        '    <th class="borderclass">NEW COMPONENT</th>\n' +

                        '    <th class="borderclass">QUANTITY</th>\n' +

                        '  </tr></thead>\n';
                    return _mainbody;
            }

        const bar = () => {

        }

        return {constructTable, bar}

    });
