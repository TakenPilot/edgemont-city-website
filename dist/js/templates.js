this["Templates"] = this["Templates"] || {};
this["Templates"]["menu-item"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"menu-item\">\n\n</div>";
  });
this["Templates"]["menu"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); partials = this.merge(partials, Handlebars.partials); data = data || {};
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  stack1 = self.invokePartial(partials['menu-item'], 'menu-item', (depth0 && depth0.item), helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;
  }

  buffer += "<div class=\"menu\">\n    ";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.item), (depth0 && depth0['in']), (depth0 && depth0.items), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>";
  return buffer;
  });