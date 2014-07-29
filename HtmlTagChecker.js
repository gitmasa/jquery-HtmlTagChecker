/*!
* jQuery HtmlTagChecker Plugin ver 0.1
*
* Copyright 2014, Tap Co., Ltd.
* Released under the MIT license.
*/

;(function( $, undefined ) {

	$.html_tag_checker = {};

	$.html_tag_checker.check = function(str, opts) {
		var config = $.extend({
			safe_attrs: {'style':true, 'class':true, 'id':true},
			safe_tagattrs: {'img':{'alt':true, 'src':true}, 'font':{'color':true, 'size':true}, 'a':{'href':true, 'target':true}, 'td':{'rowspan':true, 'colspan':true}},
			err_tags:{'script':true, 'object':true, 'iframe':true, 'frame':true, 'frameset':true, 'meta':true, 'style':true, 'body':true, 'input':true, 'form':true, 'textarea':true, 'applet':true, 'bgsound':true, 'base':true, 'embed':true, 'head':true, 'html':true, 'ilayer':true, 'layer':true, 'link':true, 'name':true, 'xml':true, 'title':true, 'basefont':true, 'id':true, 'area':true, 'col':true, 'isindex':true, 'param':true, '!doctype':true, 'marquee':true},
			single_tags:{'br':true, 'hr':true, 'img':true},
			err_in_squote:'タグ内で \' (シングルクォート)の使用はできません。',
			err_in_inequality:'タグ内で < や > の使用はできません。',
			err_disallow_tag:'使用できないタグが使用されています。',
			err_unnecessary_closing_tag:'不要な閉じタグがあります。',
			err_closing_tag_match:'閉じタグが正しくありません。',
			err_closing_tag:'閉じられていないタグがあるようです。',
			err_attr_img_src:'imgタグのリンク先が不正です。',
			err_attr_a_href:'aタグのリンク先が不正です。',
			err_attr_style_script:'style属性にスクリプトが使用されています。',
			err_attr:'許可されていない属性が使用されています。',
			is_err_quote: false
		}, opts);
		var _ret = {'status':false, 'err_str':''};
		if (typeof str !== 'string') {
			str = String(str);
		}
		str = str.replace(/\u000a/,'');
		str = str.replace(/\u000d/,'');
		str = str.replace(/\u0009/,' ');
		var len = str.length;
		var tags = [];
		var in_tag = false, tmp_tagattr='', in_tagname=false, tmp_tagname='', in_double=false;
		var tmp = '';
		var quote = function(str){ return str };
		if (config.is_err_quote) {
			quote = $.html_tag_checker.htmlspecialchars;
		}
		for (var i=0;i<len;i++) {
			tmp = str.substr(i, 1);
			if (!in_tag && tmp == '<' && i != (len-1)) {
				var tmp2 = str.substr(i+1, 1);
				if (tmp2.match(/[a-zA-Z]/) || tmp2 == '/') {
					in_tag = in_tagname = true;
					tmp_tagattr = tmp_tagname = '';
				}
			}
			if (!in_tag) { // outside tag
				continue;
			}
			if (tmp == "'") { // disallow single quote
				_ret['err_str'] = quote(config.err_in_squote); return _ret;
			}
			if (tmp == '"') { // start/end quote
				in_double = in_double ? false : true;
			}
			if (in_double && (tmp == '>' || tmp == '<')) {
				_ret['err_str'] = quote(config.err_in_inequality); return _ret;
			}
			if (in_tagname && (tmp == ' ' || tmp == '/' || tmp == '>')) {
				if (tmp == '/' && tmp_tagname == '') {
				} else {
					in_tagname = false;
				}
			}
			if (in_tagname) {
				if (tmp != '<') {
					tmp_tagname += tmp;
				}
				continue;
			}
			if (tmp == '>') {
				tags.push({'name':tmp_tagname, 'attrs':tmp_tagattr});
				in_tag = in_tagname = false;
				continue;
			}
			tmp_tagattr += tmp;
		}
		// check closing status and allowed tag
		var tags_cpy = tags.concat();
		var tag_stack = [];
		
		while (tmp = tags_cpy.shift()) {
			if (config.err_tags[tmp['name']] || !tmp['name'].match(/^\u002f?[a-zA-Z]+$/)) {
				_ret['err_str'] = quote(config.err_disallow_tag+'('+tmp['name']+')');return _ret;
			}
			if (config.single_tags[tmp['name']]) {
				continue;
			}
			if (tmp['name'].match(/^\u002f/)) {
				if (tag_stack.length == 0) {
					_ret['err_str'] = quote(config.err_unnecessary_closing_tag+'('+tmp['name']+')');return _ret;
				}
				var tmp2 = tag_stack.pop();
				if ('/'+tmp2['name'] != tmp['name']) {
					_ret['err_str'] = quote(config.err_closing_tag_match+'('+tmp2['name']+')->('+tmp['name']+')');return _ret;
				}
				continue;
			}
			tag_stack.push(tmp);
		}
		if (tag_stack.length > 0) {
			_ret['err_str'] = err_closing_tag;return _ret;
		}

		// check attrs
		for (var i=0;i<tags.length;i++) {
			tmp = tags[i];
			if (tmp['attrs'].length == 0) {
				continue;
			}
			var attrs = $.html_tag_checker.check_attrs(tmp['attrs']);
			for (var j=0;j<attrs.length;j++) {
				var attr=attrs[j];
				attr['attr'] = attr['attr'].replace(/^\"*/, '');
				attr['attr'] = attr['attr'].replace(/\"*$/, '');
				if (attr['name'] == 'href' && !attr['attr'].match(/^https?\:\u002f\u002f/)) {
					_ret['err_str'] = quote(config.err_attr_a_href+'('+attr['name']+'="'+attr['attr']+'")'); return _ret;
				}
				if (attr['name'] == 'src' && (!attr['attr'].match(/^https?\:\u002f\u002f/) || !attr['attr'].match(/\.(gif|jpg|png|GIF|JPG|PNG)$/))) {
					_ret['err_str'] = quote(config.err_attr_img_src+'('+attr['name']+'="'+attr['attr']+'")'); return _ret;
				}
				if (attr['name'] == 'style' && !attr['attr'].match(/expression/)) {
					_ret['err_str'] = quote(config.err_attr_style_script+'('+attr['name']+'="'+attr['attr']+'")'); return _ret;
				}
				if (config.safe_attrs[attr['name']]) {
					continue;
				}
				if (config.safe_tagattrs[tmp['name']]) {
					if (config.safe_tagattrs[tmp['name']][attr['name']]) {
						continue;
					}
				}
				_ret['err_str'] = quote(config.err_attr+'('+tmp['name']+')->('+attr['name']+')'); return _ret;
			}
		}

		_ret['status'] = true;
		return _ret;
	};


	// attribute parser. Using single quote is not supported
	$.html_tag_checker.check_attrs = function(attr){
		attr = attr.replace(/^\s*/, '');
		attr = attr.replace(/\s*$/, '');
		var len = attr.length;
		var ret = [];
		var in_attr = false, in_attrname = true;

		var tmp='', tmp_attrname='', tmp_attr='', start_str='';

		for (var i=0; i<len; i++) {
			tmp = attr.substr(i, 1);
			if (tmp == ' ') {
				if (start_str == '"' && in_attr) {
					tmp_attr += tmp;
					continue;
				}
				in_attr = false;
				in_attrname=true;
				if (tmp_attrname) {
					ret.push({'name':tmp_attrname.toLowerCase(), 'attr':tmp_attr}); 
				}
				tmp_attr = tmp_attrname = start_str = '';
				continue;
			}
			if (in_attrname) {
				if (tmp == '=') {
					in_attrname = false;
					in_attr = true;
					continue;
				}
				tmp_attrname += tmp;
				continue;
			}
			if (in_attr) {
				if (tmp_attr == '' && tmp == '"') {
					start_str = '"';
				}
				if (tmp_attr && tmp == '"' && start_str == '"') {
					start_str = '';
				}
				tmp_attr += tmp;
				continue;
			}
		}
		if (tmp_attrname) {
			ret.push({'name':tmp_attrname.toLowerCase(), 'attr':tmp_attr}); 
		}
		return ret;
	}

	$.html_tag_checker.htmlspecialchars = function(ch) {
		ch = ch.replace(/&/g,"&amp;");
		ch = ch.replace(/"/g,"&quot;");
		ch = ch.replace(/'/g,"&#039;");
		ch = ch.replace(/</g,"&lt;");
		ch = ch.replace(/>/g,"&gt;");
		return ch ;
	}


})( jQuery );

