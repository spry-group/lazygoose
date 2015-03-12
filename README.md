# lazygoose
A connect middleware to construct a basic REST API on top of mongoose with mongoose-rbac support.

usage:
```
var connect = require('connect') ;
var mongoose = require('mongoose');
var rbac = require('mongoose-rbac');
var lazygoose = require('lazygoose');

var UserSchema = new mongoose.Schema({
	name: String,
	providers: {
		github: {
			id: Number,
			accessToken: String,
			refreshToken: String, 
			profile: {}
		}
	}
});

UserSchema.plugin(rbac.plugin)

var UserModel = mongoose.model('User', UserSchema);

app.use('/api/v1', lazygoose());
```