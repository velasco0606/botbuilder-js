parser grammar LGFileParser;
options { tokenVocab=LGFileLexer; }

file
	: paragraph+? EOF
	;

paragraph
    : newline
    | templateDefinition
    | importDefinition
    ;

// Treat EOF as newline to hanle file end gracefully
// It's possible that parser doesn't even have to handle NEWLINE, 
// but before the syntax is finalized, we still keep the NEWLINE in grammer 
newline
    : NEWLINE
    | EOF
    ;

templateDefinition
	: templateNameLine newline templateBody?
	;

templateNameLine
	: HASH ((templateName parameters?) | errorTemplateName)
	;

errorTemplateName
    : (IDENTIFIER|TEXT_IN_NAME|OPEN_PARENTHESIS|COMMA|CLOSE_PARENTHESIS|DOT)*
    ;

templateName
    : IDENTIFIER (DOT IDENTIFIER)*
    ;

parameters
    : OPEN_PARENTHESIS (IDENTIFIER (COMMA IDENTIFIER)*)? CLOSE_PARENTHESIS
    ;

templateBody
    : normalTemplateBody                        #normalBody
    | ifElseTemplateBody                        #ifElseBody
    | switchCaseTemplateBody                    #switchCaseBody
    | structuredTemplateBody                    #structuredBody
    ;

structuredTemplateBody
    : structuredBodyNameLine structuredBodyContentLine? structuredBodyEndLine
    ;

structuredBodyNameLine
    : LEFT_SQUARE_BRACKET STRUCTURED_CONTENT STRUCTURED_NEWLINE
    ;

structuredBodyContentLine
    : (STRUCTURED_CONTENT STRUCTURED_NEWLINE)+
    ;

structuredBodyEndLine
    : STRUCTURED_TEMPLATE_BODY_END
    ;

normalTemplateBody
    : (templateString newline)+
    ;

templateString
    : normalTemplateString
    | errorTemplateString
    ;

normalTemplateString
	: DASH (WS|TEXT|EXPRESSION|ESCAPE_CHARACTER|MULTILINE_SUFFIX|MULTILINE_PREFIX)*
	;

errorTemplateString
	: INVALID_TOKEN_DEFAULT_MODE+
	;

ifElseTemplateBody
    : ifConditionRule+
    ;

ifConditionRule
    : ifCondition newline normalTemplateBody?
    ;

ifCondition
    : DASH (IF|ELSE|ELSEIF) (WS|TEXT|EXPRESSION)*
    ;

switchCaseTemplateBody
    : switchCaseRule+
    ;

switchCaseRule
    : switchCaseStat newline normalTemplateBody?
    ;

switchCaseStat
    : DASH (SWITCH|CASE|DEFAULT) (WS|TEXT|EXPRESSION)*
    ;

importDefinition
    : IMPORT_DESC IMPORT_PATH
    ;