import React from "react";
import { connect } from "react-redux";
import './home.less'

class Home extends React.Component {

    render( ) {
        const { text } = this.props;

        return (
            <div className="container">
                <h2>JUST DO WANT YOU WANT</h2>
                <div>{text}</div>
            </div>
        );
    }
}


const mapStateToProps = ( state ) => ( {
    text: state.data.textWord,
} );

const mapDispatchToProps = {};

export default connect( mapStateToProps, mapDispatchToProps )( Home );
