package dev.pizzav.meteorweb;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface MeteorWeb {
    boolean hidden() default false;

    String name() default "";

    String category() default "";

    String description() default "";
}
