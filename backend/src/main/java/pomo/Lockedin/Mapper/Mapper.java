package pomo.Lockedin.Mapper;

public interface Mapper<A, B> {

    B mapTo(A a);

    A mapFrom(B b);
}
