var fs = require("fs");
var Promise = require("bluebird");
var megaliquid = require("megaliquid");
var path = require("path");

var megaliquify = function (contents, locals, includeBase, prefix, filters) {
	var template;
	var context = megaliquid.newContext({
		locals: locals,
		filters: filters
	});

	if (!contents) {
		contents = '';
	}

	if (typeof contents != "string") {
		template = contents;
	} else {
		template = megaliquid.compile(contents);
	}

	return new Promise(function (resolve, reject) {

		context.onInclude(function (name, callback) {

			var absolute = isAbsolute(name);
			var ext = path.extname(name);
			var filePath;

			if (!absolute) {

				if (prefix) {
					name = prefix + name;
				}

				if (!ext) {
					name += ".liquid";
				}

				if (Array.isArray(includeBase)) {
					for (var i in includeBase) {
						filePath	= path.join(includeBase[i], name);

						if (fs.existsSync(filePath)) {
							break;
						}
					}
				} else {
					filePath = path.join(includeBase, name);
				}
			} else {
				filePath = name;
			}


			fs.readFile(filePath, 'utf8', function (err, text) {

				if (err) {
					reject(err);
					return callback(err);
				}

				var ast = megaliquid.parse(text);
				callback(null, ast);
			});
		});

		template(context, function (err) {
			if (err) return reject(err);
			resolve(context.getBuffer(), template);
		});
	});

};

function isAbsolute(p) {
	if (path.isAbsolute) {
		return path.isAbsolute(p);
	}

	return path.normalize(p + '/') === path.normalize(path.resolve(p) + '/');
}

module.exports = megaliquify;
